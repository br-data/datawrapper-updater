const fetch = require('node-fetch');

const { apiKey, charts } = require('./config.json');

const date = new Date();
const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
const dateString = date.toLocaleDateString('de-DE', dateOptions);

exports.datawrapperUpdater = async function (req, res) {
  for (const id of charts) {
    const update = await updateChart(id);
    const publish = await publishChart(id);

    if (update.error || update.status === 'error') {
      console.error(`Error updating chart ${id}:`, JSON.stringify(update));
    }

    if (publish.error || publish.status === 'error') {
      console.error(`Error publishing chart ${id}:`, JSON.stringify(publish));
    }
  }

  if (res && res.send) {
    res.send();
  }
};

async function updateChart(id) {
  return fetch(`https://api.datawrapper.de/v3/charts/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metadata: {
        annotate: {
          notes: `Letzte Aktualisierung: ${dateString}`
        }
      }
    })
  }).then(res => res.json());
}

async function publishChart(id) {
  return fetch(`https://api.datawrapper.de/charts/${id}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  }).then(res => res.json());
}
