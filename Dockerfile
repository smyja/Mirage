FROM library/python:3.8-slim-buster

RUN apt-get update \
    # dependencies for building Python packages
    && apt-get install -y build-essential \
    # psycopg2 dependencies
    && apt-get install -y libpq-dev \
    # Translations dependencies
    && apt-get install -y gettext \
    && apt-get install -y libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info \
    # Install git
    && apt-get install -y git \
    # cleaning up unused files
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt \
    && rm -rf /requirements.txt

COPY . /usr/src/app

EXPOSE 80
ARG SECRET_KEY
ARG DEBUG
ARG DB_HOST
ARG DB_PORT
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG SENDINBLUE_API_KEY
ARG SENDINBLUE_API_URL
ARG COUNTRY_CODE
ARG AUTH_TOKEN
ARG TWILIO_WHATSAPP_NUMBER
ARG TWILIO_PHONE_NUMBER
ARG ACCOUNT_SID
ARG CAPROVER_GIT_COMMIT_SHA
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ENV SECRET_KEY=$SECRET_KEY
ENV CAPROVER_GIT_COMMIT_SHA=$CAPROVER_GIT_COMMIT_SHA
ENV ACCOUNT_SID=$ACCOUNT_SID
ENV AUTH_TOKEN=$AUTH_TOKEN
ENV TWILIO_WHATSAPP_NUMBER=$TWILIO_WHATSAPP_NUMBER
ENV TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER
ENV COUNTRY_CODE=$COUNTRY_CODE
ENV SENDINBLUE_API_KEY=$SENDINBLUE_API_KEY
ENV SENDINBLUE_API_URL=$SENDINBLUE_API_URL
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV DB_HOST=$DB_HOST
ENV DB_PORT=$DB_PORT
ENV DB_NAME=$DB_NAME
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DEBUG=$DEBUG



CMD ["sh", "./runserver.sh"]