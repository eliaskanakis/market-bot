import uuid
import uvicorn
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.responses import HTMLResponse
from starlette.routing import Route
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
import asyncio
import pydub
from os import chdir
import os
import re
import tempfile
import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.data import DataLoader
import numpy as np
from scipy.io.wavfile import write
from scipy.io.wavfile import read
import commons
import utils
import subprocess
from data_utils import TextAudioLoader, TextAudioCollate, TextAudioSpeakerLoader, TextAudioSpeakerCollate
from models import SynthesizerTrn
from huggingface_hub import hf_hub_download
import time
import base64
from transformers import Wav2Vec2ForCTC, AutoProcessor
import openai
import json
from datetime import datetime

def log(str):
    now = datetime.now() 
    str_now = now.strftime("%d/%m/%Y %H:%M:%S")
    print(f"{str_now}: {str}")

def download_tts_model(lang, tgt_dir="./"):
    lang_dir = os.path.join(tgt_dir, f"models/{lang}")
    if os.path.isdir(lang_dir):
        return
    hf_hub_download(
        repo_id="facebook/mms-tts",
        filename="vocab.txt",
        subfolder=f"models/{lang}",
        local_dir=tgt_dir
    )
    hf_hub_download(
        repo_id="facebook/mms-tts",
        filename="config.json",
        subfolder=f"models/{lang}",
        local_dir=tgt_dir
    )
    hf_hub_download(
        repo_id="facebook/mms-tts",
        filename="G_100000.pth",
        subfolder=f"models/{lang}",
        local_dir=tgt_dir
    )
    log(f"Download tts model for language: {lang}")
    log(f"TTs model checkpoints in {lang_dir}: {os.listdir(lang_dir)}")

def get_model_prms(lang):
    if (lang in g_tts_model_prms):
        return g_tts_model_prms[lang]
    download_tts_model(lang)
    vocab_file = f"./models/{lang}/vocab.txt"
    config_file = f"./models/{lang}/config.json"
    assert os.path.isfile(config_file), f"{config_file} doesn't exist"
    hps = utils.get_hparams_from_file(config_file)
    text_mapper = TextMapper(vocab_file)
    net_g = SynthesizerTrn(
        len(text_mapper.symbols),
        hps.data.filter_length // 2 + 1,
        hps.train.segment_size // hps.data.hop_length,
        **hps.model)
    net_g.to(device)
    _ = net_g.eval()
    g_pth = f"./models/{lang}/G_100000.pth"
    log(f"load {g_pth}")
    _ = utils.load_checkpoint(g_pth, net_g, None)
    g_tts_model_prms[lang]={
        "text_mapper":text_mapper,
        "hps":hps,
        "net_g":net_g,
    }
    return g_tts_model_prms[lang]

def preprocess_char(text, lang=None):
    """
    Special treatement of characters in certain languages
    """
    log(lang)
    if lang == 'ron':
        text = text.replace("ț", "ţ")
    return text

class TextMapper(object):
    def __init__(self, vocab_file):
        self.symbols = [x.replace("\n", "") for x in open(vocab_file, encoding="utf-8").readlines()]
        self.SPACE_ID = self.symbols.index(" ")
        self._symbol_to_id = {s: i for i, s in enumerate(self.symbols)}
        self._id_to_symbol = {i: s for i, s in enumerate(self.symbols)}

    def text_to_sequence(self, text, cleaner_names):
        '''Converts a string of text to a sequence of IDs corresponding to the symbols in the text.
        Args:
        text: string to convert to a sequence
        cleaner_names: names of the cleaner functions to run the text through
        Returns:
        List of integers corresponding to the symbols in the text
        '''
        sequence = []
        clean_text = text.strip()
        for symbol in clean_text:
            symbol_id = self._symbol_to_id[symbol]
            sequence += [symbol_id]
        return sequence

    def uromanize(self, text, uroman_pl):
        iso = "xxx"
        with tempfile.NamedTemporaryFile() as tf, \
             tempfile.NamedTemporaryFile() as tf2:
            with open(tf.name, "w") as f:
                f.write("\n".join([text]))
            cmd = f"perl " + uroman_pl
            cmd += f" -l {iso} "
            cmd +=  f" < {tf.name} > {tf2.name}"
            os.system(cmd)
            outtexts = []
            with open(tf2.name) as f:
                for line in f:
                    line =  re.sub(r"\s+", " ", line).strip()
                    outtexts.append(line)
            outtext = outtexts[0]
        return outtext

    def get_text(self, text, hps):
        text_norm = self.text_to_sequence(text, hps.data.text_cleaners)
        if hps.data.add_blank:
            text_norm = commons.intersperse(text_norm, 0)
        text_norm = torch.LongTensor(text_norm)
        return text_norm

    def filter_oov(self, text):
        val_chars = self._symbol_to_id
        txt_filt = "".join(list(filter(lambda x: x in val_chars, text)))
        log(f"text after filtering OOV: {txt_filt}")
        return txt_filt

def preprocess_text(txt, text_mapper, hps, uroman_dir=None, lang=None):
    txt = preprocess_char(txt, lang=lang)
    is_uroman = hps.data.training_files.split('.')[-1] == 'uroman'
    if is_uroman:
        with tempfile.TemporaryDirectory() as tmp_dir:
            if uroman_dir is None:
                cmd = f"git clone git@github.com:isi-nlp/uroman.git {tmp_dir}"
                log(cmd)
                subprocess.check_output(cmd, shell=True)
                uroman_dir = tmp_dir
            uroman_pl = os.path.join(uroman_dir, "bin", "uroman.pl")
            log(f"uromanize")
            txt = text_mapper.uromanize(txt, uroman_pl)
            log(f"uroman text: {txt}")
    txt = txt.lower()
    txt = text_mapper.filter_oov(txt)
    return txt

def delete_old_files():
    with os.scandir("./generated-files") as listOfEntries:
        for entry in listOfEntries:
            age = time.time() - entry.stat().st_mtime
            if age > 300:
                os.remove(os.path.join("./generated-files", entry.name))

def write_mp3(file_name,sr,data,normalized=True):
    """numpy array to MP3"""
    channels = 2 if (data.ndim == 2 and data.shape[1] == 2) else 1
    if normalized:  # normalized array - each item should be a float in [-1, 1)
        data_n = np.int16(data * 2 ** 15)
    else:
        data_n = np.int16(data)
    mp3_audio = pydub.AudioSegment(data_n.tobytes(), frame_rate=sr, sample_width=2, channels=channels)
    mp3_audio.export(file_name, format="mp3", bitrate="320k")

def write_files(file_name,sampling_rate,data):
    log(f"Generate audio files {file_name}") 
    delete_old_files()
    write(f"{file_name}.wav",rate=sampling_rate,data=np.int16(data / np.max(np.abs(data)) * 32767))
    write_mp3(f"{file_name}.mp3",sampling_rate,data)

def tts(txt,lang):
    model_prms=get_model_prms(lang)
    log(f"text: {txt}")
    txt = preprocess_text(txt, model_prms["text_mapper"], model_prms["hps"], lang=lang)
    stn_tst = model_prms["text_mapper"].get_text(txt, model_prms["hps"])
    with torch.no_grad():
        x_tst = stn_tst.unsqueeze(0).to(device)
        x_tst_lengths = torch.LongTensor([stn_tst.size(0)]).to(device)
        hyp = model_prms["net_g"].infer(
            x_tst, x_tst_lengths, noise_scale=.667,
            noise_scale_w=0.8, length_scale=1.0
        )[0][0,0].cpu().float().numpy()
    
    file_name="generated-files/"+str(uuid.uuid4())
    write_files(file_name,model_prms["hps"].data.sampling_rate,hyp)
    return file_name

def get_mms_asr_model(lang):
    if (lang in g_mms_asr_model):
        return g_mms_asr_model[lang]
    model_id = "facebook/mms-1b-all"
    mms_processor = AutoProcessor.from_pretrained(model_id)
    mms_model = Wav2Vec2ForCTC.from_pretrained(model_id)
    mms_processor.tokenizer.set_target_lang(lang)
    mms_model.load_adapter(lang)
    g_mms_asr_model[lang]={
        "mms_processor":mms_processor,
        "mms_model":mms_model
    }
    return g_mms_asr_model[lang]

def mms_asr(lang,file_name):
    mms_asr_model=get_mms_asr_model(lang)
    # print the recognized text
    f = read(file_name)
    inputs = mms_asr_model["mms_processor"](np.array(f[1],dtype=float), sampling_rate=16_000, return_tensors="pt")

    with torch.no_grad():
        outputs = mms_asr_model["mms_model"](**inputs).logits

    ids = torch.argmax(outputs, dim=-1)[0]
    transcription = mms_asr_model["mms_processor"].decode(ids)

    log(f"Result:"+transcription)
    return {
        "text":transcription
    }

def asr(lang,audio_data):
    delete_old_files()
    file_name=f"generated-files/{str(uuid.uuid4())}.wav"
    wav_file = open(f"{file_name}", "wb")
    wav_file.write(base64.b64decode(audio_data))
    return mms_asr(lang,file_name)
    
async def homepage(request):
    f = open("./html/index.html", "r")
    html=f.read().replace("{{url}}",str(request.url))
    return HTMLResponse(html)

def categorize(shoppingList):
    prompt=f"""
Enclosed in triple backticks there is a comma separated shopping list.
```{','.join(shoppingList)}```
Do the following:
1 - Identify the language of the most items of the list. Let's call this language, the 'original' language.
2 - Categorize the items into the following categories:
    1 - Fruits
    2 - Vegetables
    3 - Bakery
    4 - Meat and Seafood
    5 - Dairy
    6 - Frozen Foods
    7 - Canned Goods
    8 - Pasta and Grains
    9 - Condiments and Sauces
    10 - Snacks
    11 - Beverages
    12 - Cereals
    14 - Health and Beauty
    15 - Household and Cleanng
    16 - Baby Care
    17 - Alcohol
3 - Don't include the same item into more than one categories. Use the most relevant category of each item.
4 - Exclude categories with no items
5 - Format the grouped products into a json array.
 - Each element of the array must have the following keys: 
    1 - category key where the value must be the name of the product
    2 - items where the value must be string array with the products of the category
6 - Translate the category to the 'original' language
In you answer include only the json array.
"""
    messages=[{"role": "user", "content": prompt}]
    response=openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0
    )
    return {
        "itemsByCategory": json.loads(response['choices'][0]['message']['content'])
    }

def chat(lang,shoppingList,user_request):
    prompt=f"""
Here is my shopping list enclosed into triple backticks
```{','.join(shoppingList)}```
Do the following:
1 - I may ask you the the items of a category. For example <drinks> or <tell me the drinks>.\
    Please provide me a json with the following keys:
    - "requestType": "CategoryItems"
    - "category" with value the description of the category
    - "items" whith value an array of strings of the items of the category
2 - If I ask you to remove some items, please provide me a json with the following keys:
    - "requestType": "DeleteItems"
    - "items" whith value an array of strings of the deleted items
    - "message" containing the string <The following items removed> translated to {lang}
3 - If I ask you to add some items, please provide me a json with the following keys:
    - "requestType": "AddItems"
    - "items" whith value an array of strings of the added items
    - "message" containing the string <The following items added> translated to {lang}
4 - In any other case provide a json with the following keys:
    - "requestType": "Unknown"
    - "message" containing the string <Please repeat> translated to {lang}

Special Instrunctions:
1 - The response must include only the json. Nothing else.
2 - My request maybe is misspelled. Try to match my request with the items \
    or the category of the list using a phonetic matching. For example I may say 'bτά' instead of 'ποτά'
3 - If you cannot math my request then provide a json with the following keys:
    - "requestType": "Unknown"
    - "message" containing the string <Please repeat> translated to {lang}
"""
    response=openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content":"You are a user's assistant during the shopping at the super market."},
            {"role": "user", "content":prompt},
            {"role": "assistant", "content":"Understood! I'll follow your instructions. Feel free to ask any questions or make requests related to your shopping list, and I'll respond accordingly."},
            {"role": "user", "content":user_request if user_request!="" else "xxxxxx"}
        ],
        temperature=0
    )
    
    try:
        retVal=json.loads(response['choices'][0]['message']['content'])
    except Exception as e:
        retVal={
            "requestType": "Unknown",
            "message": "Please repeat"
        }
    ttsMessage=""
    if "message" in retVal.keys():
        ttsMessage=f"{retVal['message']}."
    if "items" in retVal.keys() and retVal['items'][0] not in ttsMessage:
        ttsMessage=f"{ttsMessage}{', '.join(retVal['items'])}."
    retVal["ttsMessage"]=ttsMessage
    return retVal

async def process_tts_request(request):
    request_body = await request.json()
    queue_item={
        "reuest_type" : "tts",
        "request" : request_body,
        "response_q": asyncio.Queue()
    }
    await request.app.queue.put(queue_item)
    response = await queue_item["response_q"].get()
    return JSONResponse(response)

async def process_asr_request(request):
    request_body = await request.json()
    queue_item={
        "reuest_type" : "asr",
        "request" : request_body,
        "response_q": asyncio.Queue()
    }
    await request.app.queue.put(queue_item)
    response = await queue_item["response_q"].get()
    return JSONResponse(response)

async def process_categorize_request(request):
    request_body = await request.json()
    queue_item={
        "reuest_type" : "categorize",
        "request" : request_body,
        "response_q": asyncio.Queue()
    }
    await request.app.queue.put(queue_item)
    response = await queue_item["response_q"].get()
    return JSONResponse(response)

async def process_chat_request(request):
    log(f"request received:{request}")
    request_body = await request.json()
    queue_item={
        "reuest_type" : "chat",
        "request" : request_body,
        "response_q": asyncio.Queue()
    }
    await request.app.queue.put(queue_item)
    response = await queue_item["response_q"].get()
    log(f"response sent:{request}")
    return JSONResponse(response)

async def server_loop(q):
    log("Server loop started")
    while True:
        queue_item=await q.get()
        try:
            if queue_item["reuest_type"]=="tts":
                tts_request=queue_item["request"]
                fileName=tts(tts_request["text"],tts_request["lang"])
                await queue_item["response_q"].put({
                    "wav_file":f"{fileName}.wav",
                    "mp3_file":f"{fileName}.mp3"
                })
            elif queue_item["reuest_type"]=="asr":
                start_time = time.time()
                request=queue_item["request"]
                result=asr(request["lang"],request["audio_data"])
                result["process_time"]=f"{(time.time() - start_time)}"
                log(f"Asr seconds:{(time.time() - start_time)}")
                await queue_item["response_q"].put(result)
            elif queue_item["reuest_type"]=="categorize":
                start_time = time.time()
                request=queue_item["request"]
                result=categorize(request)
                result["process_time"]=f"{(time.time() - start_time)}"
                log(f"Categorize seconds:{(time.time() - start_time)}")
                await queue_item["response_q"].put(result)
            elif queue_item["reuest_type"]=="chat":
                start_time = time.time()
                request=queue_item["request"]
                if "userRequest" in request.keys():
                    user_request=request["userRequest"]
                elif "audio_data" in request.keys():
                    user_request=asr(request["lang"],request["audio_data"])["text"]
                    asr_time=(time.time() - start_time)
                    log(f"Asr seconds:{(time.time() - start_time)}")
                start_time = time.time()
                result=chat(request["lang"],request["shoppingList"],user_request)
                result["asr_process_time"]=f"{asr_time}"
                result["user_request"]=user_request
                result["chat_process_time"]=f"{(time.time() - start_time)}"
                log(f"Chat seconds:{(time.time() - start_time)}")
                start_time = time.time()
                result["ttsFileName"]=tts(result["ttsMessage"],request["lang"])
                result["tts_process_time"]=f"{(time.time() - start_time)}"
                log(f"Tts seconds:{(time.time() - start_time)}")
                await queue_item["response_q"].put(result)
            else:
                await queue_item["response_q"].put({
                    "message":"Uknown request type."
                })
        except Exception as e:
            log(f"Unexpected {e=}, {type(e)=}")
            await queue_item["response_q"].put({
                "error":f"{e}",
                "error_type":f"{type(e)}"
            })

async def startup_event():
    q = asyncio.Queue()
    app.queue = q
    asyncio.create_task(server_loop(q))

openai.api_key = os.getenv("OPENAI_API_KEY")
if torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")
log(f"Run with {device}")
g_tts_model_prms={}
g_mms_asr_model={}
if not os.path.exists("generated-files"):
   os.makedirs("generated-files")

app = Starlette(debug=True, routes=[
        Route('/', homepage),

        Mount('/site', app=StaticFiles(directory='site', html=True), name="site"),
        Mount('/site/_next', app=StaticFiles(directory='site/_next'), name="site/_next"),
        Mount('/site/_next/static', app=StaticFiles(directory='site/_next/static'), name="site"),
        Mount('/site/_next/static/chunks', app=StaticFiles(directory='site/_next/static/chunks'), name="site/_next/static/chunks"),
        Mount('/site/_next/static/chunks/pages', app=StaticFiles(directory='site/_next/static/chunks/pages'), name="site/_next/static/chunks/pages"),
        Mount('/site/_next/static/css', app=StaticFiles(directory='site/_next/static/css'), name="site/_next/static/css"),
        Mount('/site/_next/static/ssgC-BsX609kkW30uaBUM', app=StaticFiles(directory='site/_next/static/ssgC-BsX609kkW30uaBUM'), name="site/_next/static/ssgC-BsX609kkW30uaBUM"),
 
        Route('/chat', process_chat_request, methods=["POST"]),
        Route('/categorize', process_categorize_request, methods=["POST"]),
        Route('/tts', process_tts_request, methods=["POST"]),
        Route('/asr', process_asr_request, methods=["POST"]),
        Mount('/generated-files', app=StaticFiles(directory='generated-files'), name="generated-files"),
    ],
    middleware = [
        Middleware(CORSMiddleware, 
                   allow_origins=['*'], 
                   allow_methods=['*'])
    ])

log("Application starting...")
@app.on_event("startup")
async def startup_event():
    q = asyncio.Queue()
    app.queue = q
    asyncio.create_task(server_loop(q))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)