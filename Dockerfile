# ---- Build Python Environment ----
FROM python:3.9-slim-buster AS python-env
WORKDIR /usr/src/python-env
RUN pip install --no-cache-dir psutil requests bs4 opencv-python numpy nltk

# ---- Build Node Environment ----
FROM node:16-buster
WORKDIR /usr/src/app

# Copy Python environment
COPY --from=python-env /usr/local /usr/local

# Install Node dependencies
COPY package*.json ./
RUN npm install
RUN npm install axios
RUN npm install chalk

# Copy app source from src to root in the container
COPY src/ .

# Copy commands
#RUN mkdir -p commands
#COPY commands/* ./commands/

CMD [ "node", "index.js" ]
