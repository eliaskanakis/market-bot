'use client'

import { useState, useRef, useEffect, useCallback } from "react"
import { useMicVAD, utils } from "@ricky0123/vad-react"
import callService from "../utils/call-service"

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export default function Shopping() {
    const audioElement = useRef();
    const [audioSource, setAudioSource] = useState();
    const [isInProgress, setIsInProgress] = useState(false);
    const [chatResponse, setChatResponse] = useState("");
    const [speakState, setSpeakState] = useState("Not started");
    const [asrText, setAsrText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [shoppingList, setShoppingList] = useState([]);

    function log(msg, start) {
        console.log(`${msg}(ms):${(new Date().getTime()) - start}`)
        return new Date().getTime();
    }

    useEffect(() => {
        const tmpShoppingList = localStorage.getItem("ShoppingList");
        if (!tmpShoppingList || tmpShoppingList === "[]") {
            setShoppingList(["Αγγούρια", "Αυγά", "Αφρός ξυρίσματος", "Γάλα", "Καρότα", "Καφέ", "Κοτόπουλο",
                "Κουάκερ", "Κρασιά", "Μακαρόνια", "Μέλι", "Μήλα", "Μουστάρδα", "Μπανάνες", "Μπατονέτες",
                "Μπύρες", "Ντομάτες", "Οδοντόκρεμα", "Πατάτες", "Ρύζι", "Σαμπουάν", "Ταχίνι",
                "Τόνος", "Τορτελίνια", "Τυρί τοστ", "Φέτα", "Φουντούκια", "Φυστίκια", "Φυστικοβούτυρο",
                "Ψωμί τοστ"]);
        } else {
            setShoppingList(JSON.parse(tmpShoppingList));
        }
    }, [])

    useEffect(() => {
        audioElement.current.play();
    }, [audioSource])

    const vad = useMicVAD({
        startOnLoad: true,
        onSpeechStart: () => {
            setSpeakState("User started");
        },
        onSpeechEnd: async (audio) => {
            if (isInProgress) return;
            if (audio.length < 600 || audio.length > 48000) {
                setSpeakState("User ignored");
                return;
            }
            try {
                setIsInProgress(true);
                setSpeakState("User stopped");
                setAudioSource("short-beep.mp3");
                let start = new Date().getTime();
                const wavBuffer = utils.encodeWAV(audio);
                start = log(`Convert to wav`, start);
                const base64 = utils.arrayBufferToBase64(wavBuffer);
                start = log(`Convert to base64`, start);
                let chatRes = await callService("chat", {
                    "lang": "ell",
                    "shoppingList": shoppingList,
                    "audio_data": base64
                });
                start = log(`Call chat service`, start);
                setAsrText(`${chatRes.user_request}`);
                setChatResponse(chatRes.ttsMessage);
                if (chatRes.requestType === "DeleteItems") {
                    let tmpShoppingList = [...shoppingList];
                    for (let i = 0; i < chatRes.items.length; i++) {
                        let idx = tmpShoppingList.findIndex(itm => itm === chatRes.items[i]);
                        if (idx >= 0) tmpShoppingList.splice(idx, 1);
                    }
                    setShoppingList(tmpShoppingList);
                }
                setAudioSource(process.env.NEXT_PUBLIC_SERVICE_URL + chatRes.ttsFileName + ".mp3");
            } catch (error) {
                setErrorMessage('Error fething from url ' + process.env.NEXT_PUBLIC_SERVICE_URL + ".Message:" + error.message);
            } finally {
                setIsInProgress(false);
            }
        },
    });

    function createShoppingList() {
        if (!shoppingList) return;
        return <div class="card my-4" style={{ "width": "36rem" }}>
            <div class="card-body">
                <h5 class="card-title">Shopping List</h5>
                <p class="card-text">{shoppingList.join(',')}</p>
            </div>
        </div>
    }

    return <div>
        {errorMessage ? <div class="alert alert-warning" role="alert">
            {errorMessage}
        </div> : null}
        <div class="ms-5">
            {createShoppingList()}
        </div>
        <div class="ms-5">
            <div>{speakState}</div>
            <div class="alert alert-info" role="alert" style={{ "max-width": "36rem" }}>
                {isInProgress ? "Server processing user request" : speakState}
            </div>
            <div><span class="fw-bold">User:</span>{asrText}</div>
            <div><span class="fw-bold">System:</span>{chatResponse}</div>
            <audio controls src={audioSource} ref={audioElement} autoplay>
                <source src={audioSource} type="audio/mpeg"></source>
            </audio>
        </div>


    </div>
}