# Datawrapper-Updater

Der Datawrapper-Updater aktualisiert in regelmäßigen Abständen die Daten eines oder mehrerer Datawrapper-Diagramme und fügt der Diagrammbeschreibung einen Zeitstempel hinzu. Das Skript wird in Google Cloud (GKE) deployed und zeitgesteuert als Cron-Job ausgeführt. Ein weiteres Skript ermöglicht es, eine kleine Übersichtsseite aller konfigurierten Diagramme zu erstellen.

**Übersicht der Diagramme:** <https://br-data.github.io/datawrapper-updater/>

*⚠️ Eine alte Version des Datawrapper-Updaters, welche als Google Cloud Function ausgeführt werden kann, befindet sich im Branch [function](https://github.com/br-data/datawrapper-updater/tree/function), wird aber nicht weiterentwickelt.*

## Wann braucht man den Datawrapper-Updater?

Datawrapper-Diagramme können ihre Daten aus einem Google Spreadsheet oder von einer externen CSV-Datei, beziehungsweise einer CSV-fähigen API, beziehen. Wie häufig die Daten aus einer Datenquelle aktualisiert werden, hängt davon ab, wann das Diagramm zuletzt veröffentlicht wurde. Wurde das Diagramm vor weniger als 24 Stunden veröffentlicht, werden die Daten jede Minute aktualisiert. In den ersten 30 Tagen nach der letzten Veröffentlichung werden die Daten dann noch stündlich aktualisiert (siehe [Datawrapper-Academy](https://academy.datawrapper.de/article/60-external-data-sources))

Alternativ können Daten auch direkt, ohne Caching eingebunden werden. Jeder Aufruf des Diagramms erzeugt dann einen Aufruf der (eigenen) Datenschnittstelle. Die direkte Datenanbindung ist manchmal aber nicht realisierbar (Stichwort: HTTPS, CORS) oder man möchte häufigere und längere Update-Intervalle. Hier kommt der Datawrapper-Updater ins Spiel.

## Verwendung

1. Repository klonen `git clone https://...`
2. Erforderliche Module installieren `npm install`
3. Entwicklungsserver starten `npm watch`

Um die Module installieren und die Entwicklerwerkzeuge nutzen zu können, muss vorher die JavaScript-Runtime [Node.js](https://nodejs.org/en/download/) installiert werden. Informationen für Entwickler finden sich weiter [unten](#user-content-entwickeln).

## Konfiguration

In der Konfiguration wird festgelegt, welche Datawrapper-Diagramme aktualisiert und wo die Daten dafür herkommen sollen.

Damit der Updater die Datawrapper-Diagramme aktualisieren kann, wird ein API-Token benötigt. Diesen kann sich jeder angemeldete Benutzer einfach [online erstellen](https://app.datawrapper.de/account/api-tokens). Für Entwicklungszwecke sollte der API-Token in einer Textdatei mit dem Namen `.env` gespeichert werden. Eine Vorlage dafür gibt unter `.env.template`:

```text
DATAWRAPPER_API_KEY=<TOKEN>
```

Alle Umgebungsvariablen werden mit Hilfe der [dotenv](https://github.com/motdotla/dotenv)-Library aus der `.env`-Datei geladen. Für das Live-Deployment hingegen werden die Umgebungsvariablen automatisch beim Bauen der Anwendung aus dem Secret Manager injiziert (siehe [Deployment](#deployment)).

Zum Anlegen der Konfiguration empfiehlt es sich den Inhalt der Datei `config.template.json` in eine neue Datei `config.json` zu kopieren.

```json
[
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
    "csvUrl": "https://example.com/my-csv-file-2.csv",
    "height": 400
  },
  {
    "id": "A2pSTY",
    "title": "Pie chart",
    "description": "Nobody should make pie charts",
    "csvUrl": "https://example.com/my-csv-file-3.csv",
    "width": 400,
    "height": 400
  }
]
```

Welche Charts aktualisiert werden sollen, wird über die Datawrapper-ID, zum Beispiel `QW2ItS`, festgelegt.

Der Titel `title` wird nicht benötigt, hilft aber dabei einzelne Diagramme wiederzufinden.

Die Beschreibung `description` wird unterhalb des Titels angezeigt und jeweils noch mit dem Datum der letzten Aktualisierung (Stand: 30.04.2020) versehen. Wird keine `description` angegeben oder ist diese `false`, wird kein Zeitstempel hinzugefügt, um zu verhindern, dass die Originalbeschreibung des Diagramms überschrieben wird. Möchte man einen Zeitstempel und keine Beschreibung, reicht es einen leeren String `""` als Wert anzugeben.

Das Feld `csvURl` gibt an, woher das Diagramm die Daten bekommen soll. Momentan werden nur CSV-Dateien und APIs unterstützt, welche Daten im CSV-Format zurückgeben. Das direkte Einbinden von Google Spreadsheets wird noch nicht unterstützt. Allerdings kann man relativ einfach an den CSV-Link hinter einem Google Spreadsheet herankommen, in dem man am Ende einer Spreadsheet-URL `edit#gid=281917130` durch `export?format=csv#gid=281917130` ersetzen. Der Parameter `gid` steht dabei für das aktuelle Arbeitsblatt.

Optional können für jedes Diagramm noch eine Breite `width` und Höhe `height` angegeben werden. Diese Angaben werden jedoch nur von der generierte Übersichtsseite genutzt, um das Diagramm sinnvoll darzustellen und einen Embed-Code (iFrame) zu erzeugen. Die Standardeinstellungen sind 680 Pixel für die Breite sind und 400 Pixel für die Höhe.

## Übersichtsseite

Um den Überblick zu behalten, gibt es die Möglichkeit eine [kleine Übersichtsseite der Diagramme](https://br-data.github.io/datawrapper-updater/) aus der Konfiguration zu erzeugen.

```console
$ node docs/generator.js
```

Dabei wir ein iFrame zur Vorschau des jeweiligen Diagrams und der jeweilige Embed-Code dazu in `docs/template.html` erzeugt. Außerdem gibt es einen Link, um das Diagramm direkt in Datawrapper zu bearbeiten. Um zu einer richtigen Webseite zu kommen, sollte es in den meisten Fällen ausreichen, den Inhalt der `docs/template.html` in den Body der `docs/index.html` zu kopieren. Der Inhalt des `docs`-Verzeichnis kann dann mit [Github Page](https://guides.github.com/features/pages/) ausgeliefert werden.

## Deployment

Die Anwendung wird automatisch mit Github Action gebaut und über die Google Cloud ausgeliefert. Jeder Commit auf den `develop` oder `live`-Branch des Repositories startet einen neuen Build. Das Deployment und der Cron Job wird in der Datei `config.yaml` konfiguriert. Die Konfiguration für den Github-Workflow in `.github/workflow` sollte nicht angefasst werden. Für mehr Informationen, siehe [br-data/cloud-deploy-template](https://github.com/br-data/cloud-deploy-template).
