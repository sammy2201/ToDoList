//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

mongoose.connect(process.env.mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true,
  // sslCA: yourSSLCertificate, // path to your SSL certificate file
});

//schemacreate

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "welcome!",
});
const item2 = new Item({
  name: "Hit + button to add items.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItem = [item1, item2, item3];

const ListsSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});
const List = mongoose.model("List", ListsSchema);

//set n use

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//get

app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find();

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItem);
      console.log("done");
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  } catch (err) {
    console.error("error: " + err);
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      // New list
      const list = new List({
        name: customListName,
        items: defaultItem,
      });

      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (err) {
    console.error("error: " + err);
  }
});

//post

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.error("error: " + err);
    }
  }
});

app.post("/delete", async (req, res) => {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedId);
      console.log("done remove");
      res.redirect("/");
    } catch (err) {
      console.error("error: " + err);
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        const itemIndex = foundList.items.findIndex(
          (item) => item._id.toString() === checkedId
        );
        if (itemIndex !== -1) {
          foundList.items.splice(itemIndex, 1);
          await foundList.save();
          res.redirect("/" + listName);
        }
      }
    } catch (err) {
      console.error("error: " + err);
    }
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
