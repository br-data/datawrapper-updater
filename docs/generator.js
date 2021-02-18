const fs = require('fs');
const { charts } = require('../config.json');

let toc = '';

charts.forEach(chart => {
  toc += `
    <li><a href="#id-${chart.id}">${chart.title}</a></li>`;
});

let sections = '';

charts.forEach(chart => {
  const iframe = `
    <iframe title="${chart.title}" aria-label="Interaktives Diagramm" id="datawrapper-chart-${chart.id}" src="https://datawrapper.dwcdn.net/${chart.id}" scrolling="no" frameborder="0" style="width: 100%; border: none;" height="${chart.height || 400}" width="${chart.width || 680}"></iframe>`;

  sections += `
  <section id="id-${chart.id}">
    ${iframe.trim()}
    <textarea readonly>${iframe.trim()}</textarea>
    <p><a href="https://app.datawrapper.de/chart/${chart.id}/visualize#refine-the-chart">In Datawrapper bearbeiten</a> | <a href="https://datawrapper.dwcdn.net/${chart.id}/">Vorschau öffnen</a> | <a href="${chart.csvUrl}">Daten anschauen</a></p>
  </section>
  `;
});

let html = `
  <h1>Übersicht: Corona-Grafiken</h1>
  <ul>
    ${toc.trim()}
  </ul>
  ${sections.trim()}
`;

fs.writeFileSync(`${__dirname}/template.html`, html);
