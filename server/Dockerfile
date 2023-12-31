# syntax=docker/dockerfile:1

FROM python:3.9

RUN apt-get -y update
RUN apt-get install -y ffmpeg

WORKDIR /code

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user
# Switch to the "user" user
USER user
# Set home to the user's home directory
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH
 
# Set the working directory to the user's home directory
WORKDIR $HOME/app
# Copy the current directory contents into the container at $HOME/app setting the owner to the user
COPY --chown=user . $HOME/app

RUN git clone https://github.com/jaywalnut310/vits.git
RUN cd ./vits/monotonic_align && python3 setup.py build_ext --inpla
ENV PYTHONPATH=/home/user/app/vits:$PYTHONPATH
	
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]