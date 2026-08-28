const { renderToString } = require("react-dom/server");
const React = require("react");
try {
  console.log(renderToString(React.createElement("span", null, NaN, "%")));
} catch(e) {
  console.log("Error:", e.message);
}
