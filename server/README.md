# MarketBot Server

This is an experimental AI service that processes speech and delivers audio messages to the client, providing voice guidance to the user throughout the shopping process.

## Description

An instance of the server is available at (https://ekanakis-marketbot.hf.space/). This instance is installed on a basic infrastructure, and the average response time is approximately 7 seconds.
Please note that there is no guarantee of uninterrupted functionality, as the [ChatGPT](https://chat.openai.com/) is funded through my personal account.  
A video presentation is accessible at [youtube](https://www.youtube.com/watch?v=-pK0CueuXKM).  
Additional details can be found [here](https://www.linkedin.com/pulse/chatbot-offers-voice-guidance-during-shopping-process-kanakis-pmp%3FtrackingId=ZFcidBoXQF6q7GCCFa9C%252Bg%253D%253D/?trackingId=ZFcidBoXQF6q7GCCFa9C%2Bg%3D%3D).  

The server provides the following endpoints:
* POST /tts (e.g: http://127.0.0.1:8000/tts or https://ekanakis-marketbot.hf.space/tts)  
Request example:{  
    "lang": "eng",  
    "text": "Bananas and apples."  
}  
Request example:{  
    "wav_file": "generated-files/3d8ba892-0880-4462-915a-fb06ae8d5c56.wav",  
    "mp3_file": "generated-files/3d8ba892-0880-4462-915a-fb06ae8d5c56.mp3"  
}
* POST /asr  
Request example:{  
    "lang": "eng",  
    "audio_data": "{{waveform converted to base 64}}"
}  
Response example:{  
    "text": "Tell me the fruits",
    "process_time": "1.14"
}
* POST /categorize  
Request example:[  
    "bananas", "apples", "tomatoes", "potatoes"
]  
Response example:{  
  "itemsByCategory": [{  
    "category": "Fruits",  
    "items": ["bananas","apples"]  
  },{  
    "category": "Vegetables",  
    "items": ["potatoes","tomatoes"]  
  }],    
  "process_time": "1.93"  
}
* POST /chat  
Request example:{  
    "lang": "eng",  
    shoppingList": ["bananas", "apples", "tomatoes", "potatoes"],  
    "audio_data": "{{waveform converted to base 64}}"
}  
Response example:{  
    "text": "Tell me the fruits",  
    "process_time": "1.14",  
    "requestType": "CategoryItems",  
    "items": ["bananas","apples"],  
    "asr_process_time": "1.25",  
    "user_request": "ένα 2ύο τρία",  
    "chat_process_time": "1.70",  
    "ttsFileName": "generated-files/05b714ca-bfa1-4b02-98c8-c5bc51e80eb8",  
    "tts_process_time": "3.24"  
}

## Getting Started

### Dependencies

* Python 3.9
* [Hugging Face Transformers](https://huggingface.co/)
* [PyTorch](https://pytorch.org/)
* [VITS](https://github.com/jaywalnut310/vits)
* [Massively Multilingual Speech (MMS) : Text-to-Speech Models](https://huggingface.co/facebook/mms-tts)
* [Massively Multilingual Speech (MMS) - Finetuned ASR - ALL](https://huggingface.co/facebook/mms-1b-all)
* [VITS: Conditional Variational Autoencoder with Adversarial Learning for End-to-End Text-to-Speech](https://github.com/jaywalnut310/vits)

### Installing

To set up a local development environment, follow the instructions provided at  https://github.com/eliaskanakis/market-bot.  

### Executing program

To launch the server:
* cd [local repository path]/server/
* python -m server

## Authors

* [Elias Kanakis](https://www.linkedin.com/in/elias-kanakis/)
* [Zafiris Kanakis](https://www.linkedin.com/in/zafeiris-kanakis-759818271/)

## License

This project is licensed under the [CC-BY-NC 4.0] License. 

## Acknowledgments

* [Hugging Face](https://huggingface.co/). Open source data science and machine learning platform
* [Massively Multilingual Speech (MMS) : Text-to-Speech Models](https://huggingface.co/facebook/mms-tts)
* [Massively Multilingual Speech (MMS) - Finetuned ASR - ALL](https://huggingface.co/facebook/mms-1b-all)
* [VITS: Conditional Variational Autoencoder with Adversarial Learning for End-to-End Text-to-Speech](https://github.com/jaywalnut310/vits)
* [PyTorch](https://pytorch.org/)