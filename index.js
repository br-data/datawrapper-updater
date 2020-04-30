const fetch = require('node-fetch');

const { apiKey, charts } = require('./config.json');

const date = new Date();
const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
const dateString = date.toLocaleDateString('de-DE', dateOptions);

exports.datawrapperUpdater = async function (req, res) {
  for (const chart of charts) {
    const { id, csvUrl } = chart;

    const csvData = await getCsv(csvUrl);
    const dataStatus = await updateData(id, csvData);
    const metaStatus = await updateMeta(id);
    const publishStatus = await publishChart(id);

    if (dataStatus.error) {
      console.error(`Error updating data for chart ${id}:`, JSON.stringify(dataStatus));
    }

    if (metaStatus.error || metaStatus.status === 'error') {
      console.error(`Error updating meta data for chart ${id}:`, JSON.stringify(metaStatus));
    }

    if (publishStatus.error || publishStatus.status === 'error') {
      console.error(`Error publishing chart ${id}:`, JSON.stringify(publishStatus));
    }
  }

  if (res && res.send) {
    res.send();
  }
};

async function getCsv(csvUrl) {
  return fetch(csvUrl, {
    method: 'GET'
  }).then(res => res.text());
}

async function updateData(id, csv) {
  return fetch(`https://api.datawrapper.de/v3/charts/${id}/data`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'text/csv'
    },
    body: csv
  }).then(res => res.text());
}

async function updateMeta(id) {
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
