# Datawrapper Updater



## Verwendung

Diese Anleitung geht davon aus, dass bereits ein Google Cloud-Konto vorhanden und ein Rechnungskonto eingerichtet ist. Außerdem sollte das Google Cloud-Kommandzeilenwerkzeug [installiert](https://cloud.google.com/sdk/install) und mit einem Benutzerkonto [verknüpft](https://cloud.google.com/sdk/docs/initializing) sein.

### Projekt anlegen

Neues Projekt mit der ID `brdata-corona` erstellen. Der Parameter `--name` ist optional.

```console
$ gcloud projects create brdata-corona --name=30-BRData-corona
```

Das Projekt als aktuelles Arbeitsprojekt festlegen:

```console
$ gcloud config set project brdata-corona
```

### Updater deployen

Google Cloud Function für das aktuelle Projekt aktivieren:

```console
$ gcloud services enable cloudfunctions.googleapis.com
```

Rechenzentrum *europe-west3* (Frankfurt) als Ziel für das Funktions-Deployment festlegen. Das gewählte Rechenzentrum muss identisch sein, mit dem Rechenzentrum für die Firestore-Datenbank:

```console
$ gcloud config set functions/region europe-west3
```

Neues Pub/Sub-Thema *datawrapper-update* erstellen, welches die Updater-Funktion auslöst:

```console
$ gcloud pubsub topics create datawrapper-update
```

Updater-Funktion deployen und den Pub/Sub-Auslöser *datawrapper-update* festlegen

```console
$ gcloud functions deploy datawrapperUpdater --runtime="nodejs10" --trigger-topic="datawrapper-update"
```

Die Abfrage, ob auch eine authentifizierte Ausführung erlaubt werden soll, kann in dem meisten Fällen mit „Nein“ beantwortet werden, da die Funktion vom Google Cloud Scheduler zeitgesteuert ausgelöst werden kann.

```console
Allow unauthenticated invocations of new function [datawrapperUpdater]? (y/N)?
```

Falls man später doch eine nicht authentifizierte Ausführung erlauben möchte, muss man die entsprechende IAM-Richtline ändern:

```console
$ gcloud alpha functions add-iam-policy-binding datawrapperUpdater --member=allUsers --role=roles/cloudfunctions.invoker
```

## Updates zeitgesteuert starten

Der Google Cloud Scheduler erlaubt es den Updater zeitgesteuert, zu bestimmten Uhrzeiten, auszuführen. Dazu muss der Cloud Scheduler jedoch erstmal für das Projekt aktiviert werden:

```console
$ gcloud services enable cloudscheduler.googleapis.com
```

Wie häufig die Updater-Funktion ausgeführt werden soll, kann mit dem Parameter `--schedule` festgelegt werden, welche die Crontab-Syntax unterstützt. Dabei hilft zum Beispiel der [crontab.guru](https://crontab.guru/). Außerdem muss die gültige Zeitzone `--time-zone` und der Pub/Sub-Auslöser `--topic` festgelegt werden. In diesem Beispiel wird der Updater alle zwei Stunden von 8 bis 20 Uhr ausgeführt:

```console
$ gcloud scheduler jobs create pubsub brdata-corona --topic=datawrapper-update --schedule="0 8-20/2 * * *" --time-zone="Europe/Brussels" --message-body="undefined"
```
