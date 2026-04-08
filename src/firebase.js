const axios = require("axios");
const { QA_FB } = require("./config");

async function qaGet(subPath) {
  const { data } = await axios.get(`${QA_FB}${subPath || ""}.json`);
  return data;
}

async function qaPost(record) {
  const { data } = await axios.post(`${QA_FB}.json`, record);
  return data;
}

async function qaPut(subPath, record) {
  const { data } = await axios.put(`${QA_FB}${subPath}.json`, record);
  return data;
}

async function qaDelete(subPath) {
  const { data } = await axios.delete(`${QA_FB}${subPath}.json`);
  return data;
}

module.exports = { qaGet, qaPost, qaPut, qaDelete };
