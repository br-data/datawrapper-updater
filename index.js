const fetch = require('node-fetch');

const { apiKey, charts } = require('./config.json');

exports.datawrapperUpdater = async function (req, res) {
  for (const chart of charts) {
    const { id, description, csvUrl } = chart;

    const date = new Date();
    const dateString = `${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear()}`;

    const csvData = await getCsv(id, csvUrl);

    if (csvData.error) {
      console.error(csvData.error);
    } else {
      const updateDataStatus = await updateData(id, csvData);

      if (updateDataStatus.error) {
        console.error(
          `Error updating data for chart ${id}:`,
          JSON.stringify(updateDataStatus)
        );
      }

      if (description) {
        const updateMetaStatus = await updateMeta(id, description, dateString);

        if (updateMetaStatus.error || updateMetaStatus.status === 'error') {
          console.error(
            `Error updating meta data for chart ${id}:`,
            JSON.stringify(updateMetaStatus)
          );
        }
      }

      const publishStatus = await publishChart(id);
      if (publishStatus.error || publishStatus.status === 'error') {
        console.error(
          `Error publishing chart ${id}:`,
          JSON.stringify(publishStatus)
        );
      }
    }
  }

  if (res && res.send) {
    res.send();
  }
};

async function getCsv(id, csvUrl) {
  return fetch(csvUrl, {
    method: 'GET',
  })
    .then((res) => res.text())
    .catch(() => ({
      error: `Error fetching data for chart ${id} from ${csvUrl}`,
    }));
}

async function updateData(id, csv) {
  return fetch(`https://api.datawrapper.de/v3/charts/${id}/data`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'text/csv',
    },
    body: csv,
  }).then((res) => res.text());
}

async function updateMeta(id, description, dateString) {
  return fetch(`https://api.datawrapper.de/v3/charts/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata: {
        describe: {
          intro: `${description} (Stand: ${dateString})`,
        },
      },
    }),
  }).then((res) => res.json());
}

async function publishChart(id) {
  return fetch(`https://api.datawrapper.de/charts/${id}/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }).then((res) => res.json());
}
