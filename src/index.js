import hh from "hyperscript-helpers";
import { h, diff, patch } from "virtual-dom";
import createElement from "virtual-dom/create-element";

const { div, button, input, table, tbody, tr, th, td } = hh(h);

const MSGS = {
  ADD_LOCATION: "ADD_LOCATION",
  REMOVE_LOCATION: "REMOVE_LOCATION",
  UPDATE_INPUT: "UPDATE_INPUT",
};

function view(dispatch, model) {
  const btnStyle =
    "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2";

  return div({ className: "flex flex-col items-center gap-4" }, [
    div({ className: "relative" }, [
      input({
        id: "Location",
        type: "text",
        value: model.input,
        className:
          "border-b border-gray-300 py-1 focus:border-b-2 focus:border-blue-700 transition-colors focus:outline-none peer bg-inherit",
        oninput: (e) => dispatch(MSGS.UPDATE_INPUT, e.target.value),
      }),
      button({ className: btnStyle, onclick: () => dispatch(MSGS.ADD_LOCATION) }, "Add"),
    ]),
    table({ className: "w-full text-sm text-left text-gray-500" }, [
      tbody(
        { id: "table-body" },
        model.locations.map((loc) =>
          tr({ className: "bg-white border-b" }, [
            th(
              {
                scope: "row",
                className: "px-6 py-4 font-medium text-gray-900",
              },
              loc.city
            ),
            td({ className: "px-6 py-4" }, `${loc.temp}°C`),
            td({ className: "px-6 py-4" }, `${loc.minTemp}°C`),
            td({ className: "px-6 py-4" }, `${loc.maxTemp}°C`),
            td({ className: "px-6 py-4" }, button({ onclick: () => dispatch(MSGS.REMOVE_LOCATION, loc.city) }, "🗑️")),
          ])
        )
      ),
    ]),
  ]);
}

async function fetchWeather(city) {
  const apiKey = "b63027b332a5d493642a3946ed6f1990";
  const apiBase = "https://api.openweathermap.org/data/2.5/weather";
  const apiURL = `${apiBase}?q=${encodeURI(city)}&units=metric&APPID=${apiKey}`;

  const response = await fetch(apiURL);
  if (response.status === 200) {
    const body = await response.json();
    return {
      city,
      temp: body.main.temp,
      minTemp: body.main.temp_min,
      maxTemp: body.main.temp_max,
    };
  }
  throw new Error("Error fetching weather data");
}

function update(msg, model, value) {
  switch (msg) {
    case MSGS.UPDATE_INPUT:
      return { ...model, input: value };

    case MSGS.ADD_LOCATION:
      if (!model.input) return model;

      fetchWeather(model.input)
        .then((newLocation) => {
          model.locations.push(newLocation);
          model.input = "";
          viewAndUpdate(model);
        })
        .catch((error) => console.error(error));
      return model;

    case MSGS.REMOVE_LOCATION:
      return {
        ...model,
        locations: model.locations.filter((loc) => loc.city !== value),
      };

    default:
      return model;
  }
}
function app(initModel, update, view, node) {
  let model = initModel;
  let currentView = view(dispatch, model);
  let rootNode = createElement(currentView);
  node.appendChild(rootNode);

  function dispatch(msg, value) {
    model = update(msg, model, value);
    const updatedView = view(dispatch, model);
    const patches = diff(currentView, updatedView);
    rootNode = patch(rootNode, patches);
    currentView = updatedView;
  }
}
const initModel = {
  input: "",
  locations: [],
};
const rootNode = document.getElementById("app");

app(initModel, update, view, rootNode);
