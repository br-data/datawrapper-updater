# Datawrapper-Updater

Datawrapper-Diagramme können mit einem Google Spreadsheet, einer externen CSV-Datei oder einer CSV-API verbunden werden, um daraus Daten zu beziehen. Je nach verwendeter Methode müssen jedoch die Diagramme jedoch neu publiziert werden, wenn sich die Daten geändert haben. Der Datawrapper-Updater übernimmt diese Aufgabe mit einem einfachen Skript, welches zeitgesteuert in der Cloud ausgeführt werden kann.

## Verwendung

1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. Entwicklungsserver starten `npm watch`

Um die Module installieren und die Entwicklerwerkzeuge nutzen zu können, muss vorher die JavaScript-Runtime [Node.js](https://nodejs.org/en/download/) installiert werden. Informationen für Entwickler finden sich weiter [unten](#user-content-entwickeln).

## Konfiguration

In der Konfiguration wird festgelegt, welche Datawrapper-Diagramme aktualisiert und wo die Daten dafür herkommen sollen. Zum Anlegen der Konfiguration empfiehlt es sich den Inhalt der Datei `config.template.json` in eine neue Datei `config.json` zu kopieren.

Damit der Updater die Datawrapper-Diagramme aktualisieren kann, wird ein API-Token benötigt. Diesen kann sich jeder angemeldete Benutzer einfach [online erstellen](https://app.datawrapper.de/account/api-tokens).

```json
{
  "url": "https://api.datawrapper.de/v3/charts/",
  "apiKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "charts": [
    {
      "id": "QW2ItS",
      "title": "Line chart",
      "description": "Look at my beautiful data",
      "csvUrl": "https://example.com/my-csv-file-1.csv"
    },
    {
      "id": "RMP7TA",
      "title": "Bar chart",
      "description": "My favourite bar is a bar chart",
      "csvUrl": "https://example.com/my-csv-file-2.csv"
    },
    {
      "id": "A2pSTY",
      "title": "Pie chart",
      "description": "Nobody should make pie charts",
      "csvUrl": "https://example.com/my-csv-file-3.csv"
    }
  ]
}
```

Die Beschreibung `description` wird unterhalb des Titels angezeigt und jeweils noch mit dem Datum der letzten Aktualisierung (Stand: 30.04.2020) versehen. Der Titel `title` wird nicht benötigt, hilft aber dabei einzelne Diagramme wiederzufinden.

**Hinweis:** Momentan werden nur CSV-Dateien und APIs unterstützt, welche Daten im CSV-Format zurückgeben. Das direkte Einbinden von Google Spreadsheets wird noch nicht (oder nur über Umwege) unterstützt.

## Deployment

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

Rechenzentrum *europe-west3* (Frankfurt) als Ziel für das Deployment festlegen:

```console
$ gcloud config set functions/region europe-west3
```

Neues Pub/Sub-Thema *datawrapper-update* erstellen, welches die Updater-Funktion auslöst:

```console
$ gcloud pubsub topics create datawrapper-update
```

Updater-Funktion deployen und den Pub/Sub-Auslöser *datawrapper-update* festlegen

```console
$ gcloud functions deploy datawrapperUpdater --runtime=nodejs10 --trigger-topic=datawrapper-update
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

## Lokale Entwicklungsumgebung

Um das Skript `index.js` lokal zu testen, verwendet man am besten das Google Functions Framework. Das Functions Framework kann mit dem Befehl `npm run watch` gestartet werden. Das hat den Vorteil, dass das Skript jedes Mal neu geladen wird, sobald man Änderungen am Code vornimmt.

Man kann das Functions Framework aber auch manuell installieren und ausführen:

```console
$ npm i -g @google-cloud/functions-framework
```

Funktion *datawrapperUpdater* starten:

```console
$ functions-framework --target=datawrapperUpdater
```

Funktion durch einen HTTP-Request starten:

```console
$ curl -X GET 'localhost:8080'
```
