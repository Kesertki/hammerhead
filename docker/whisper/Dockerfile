# Using latest python version in 3.10
FROM python:3.10.11-bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Install Whisper
RUN pip install git+https://github.com/openai/whisper.git

# Install model files so they don't download each time
RUN whisper --model tiny dummy.webm; exit 0
#RUN whisper --model base dummy.webm; exit 0
#RUN whisper --model small dummy.webm; exit 0
#RUN whisper --model medium dummy.webm; exit 0
#RUN whisper --model large dummy.webm; exit 0
#RUN whisper --model tiny.en dummy.webm; exit 0
#RUN whisper --model base.en dummy.webm; exit 0
#RUN whisper --model small.en dummy.webm; exit 0
#RUN whisper --model medium.en dummy.webm; exit 0

ENTRYPOINT ["whisper"]
CMD ["--help"]