'use client'

import { useState, useEffect, useCallback } from "react"
import { useMicVAD, utils } from "@ricky0123/vad-react"
import callService from "../utils/call-service"

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export default function Shopping() {
    const [isInProgress, setIsInProgress] = useState(false);
    const [chatResponse, setChatResponse] = useState("");
    const [sessionId] = useState(uuidv4().toString());
    const [beepAudio] = useState(new Audio("short-beep.mp3"));
    const [audioList, setAudioList] = useState([]);
    const [speakState, setSpeakState] = useState("Not started");
    const audioItemKey = (audioURL) => audioURL.substring(-10);
    const [asrText, setAsrText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [shoppingList, setShoppingList] = useState(["Αγγούρια", "Αυγά", "Αφρός ξυρίσματος", "Γάλα", "Καρότα", "Καφέ", "Κοτόπουλο",
        "Κουάκερ", "Κρασιά", "Μακαρόνια", "Μέλι", "Μήλα", "Μουστάρδα", "Μπανάνες", "Μπατονέτες",
        "Μπύρες", "Ντομάτες", "Οδοντόκρεμα", "Πατάτες", "Ρύζι", "Σαμπουάν", "Ταχίνι",
        "Τόνος", "Τορτελίνια", "Τυρί τοστ", "Φέτα", "Φουντούκια", "Φυστίκια", "Φυστικοβούτυρο",
        "Ψωμί τοστ"]);

    function log(msg, start) {
        console.log(`${msg}(ms):${(new Date().getTime()) - start}`)
        return new Date().getTime();
    }

    const vad = useMicVAD({
        startOnLoad: true,
        onSpeechStart: () => {
            setSpeakState("User started");
        },
        onSpeechEnd: async (audio) => {
            if (isInProgress) return;
            if (audio.length<600 || audio.length>48000) {
                setSpeakState("User ignored");
                return;
            }
            try {
                setIsInProgress(true);
                setSpeakState("User stopped");
                beepAudio.play();
                let start = new Date().getTime();
                const wavBuffer = utils.encodeWAV(audio);
                start = log(`Convert to wav`, start);
                const base64 = utils.arrayBufferToBase64(wavBuffer);
                start = log(`Convert to base64`, start);
                /*onst localUrl = `data:audio/wav;base64,${base64}`;
                setAudioList((old) => [localUrl, ...old]);
                start=log(`Create Audio List Item`,start);*/
                let chatRes = await callService("chat", {
                    "lang": "ell",
                    "shoppingList": shoppingList,
                    "audio_data": base64
                });
                start = log(`Call chat service`, start);
                setAsrText(`${chatRes.user_request}`);
                setChatResponse(chatRes.ttsMessage);
                if (chatRes.requestType==="DeleteItems"){
                    tmpShoppingList=[...shoppingList];
                    for(let i=0;i<chatRes.items.length;i++){
                        let idx=tmpShoppingList.findIndex(itm=>itm===chatRes.items[i]);
                        if (idx>=0) tmpShoppingList.splice(idx,1);
                    }
                    setShoppingList(tmpShoppingList);
                }
                let ttsAudio = new Audio(process.env.NEXT_PUBLIC_SERVICE_URL + chatRes.ttsFileName + ".mp3");
                await ttsAudio.play();
            } catch (error) {
                setErrorMessage('Error fething from url ' + process.env.NEXT_PUBLIC_SERVICE_URL + ".Message:" + error.message);
            } finally{
                setIsInProgress(false);
            }
        },
    });

    async function speak(text) {
        let start = new Date().getTime();
        let ttsResult = await callService("tts", {
            "lang": "ell",
            "text": text
        });
        start = log(`Text To Speach Service Call`, start);
        let ttsAudio = new Audio(process.env.NEXT_PUBLIC_SERVICE_URL + ttsResult.mp3_file);
        ttsAudio.play()
    }

    function createShoppingList() {
        if (!shoppingList) return;
        let items = shoppingList.map((item, i) => {
            return <li key={"item" + i}>{item}</li>
        });
        return <ul>
            {items}
        </ul>
    }

    return <div>
        {errorMessage ? <div>Error:{errorMessage}</div> : null}
        setviceUrl:{process.env.NEXT_PUBLIC_SERVICE_URL}
        {createShoppingList()}
        <div>{speakState}</div>
        <div>User:{asrText}</div>
        <div>System:{chatResponse}</div>
        <ol
            id="playlist"
            className="self-center pl-0 max-h-[400px] overflow-y-auto no-scrollbar list-none"
        >
            {audioList.map((audioURL) => {
                return (
                    <li className="pl-0" key={audioItemKey(audioURL)}>
                        <audio src={audioURL} controls />
                    </li>
                )
            })}
        </ol>
    </div>
}