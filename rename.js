// use Google Sheet to save in CSV format
// CSV -> JSON: https://csvjson.com/csv2json
// JSON -> CSV: https://csvjson.com/json2csv

// https://linguinecode.com/post/rename-files-using-nodejs

const {
  readdirSync,
  rename,
  writeFileSync,
  existsSync,
  mkdirSync,
} = require("fs");
const { resolve } = require("path");

const productsImageMap = require("./json/products_images_map.json");

const PROJECT_PATH = __dirname;
const SOURCE_FOLDER_NAME = "source";
const DESTINATION_FOLDER_NAME = "destination";
const LOG_FOLDER_NAME = "log";
const FILE_EXTENSION = ".jpg";

const SOURCE_PATH = resolve(PROJECT_PATH, SOURCE_FOLDER_NAME);
const DESTINATION_PATH = resolve(PROJECT_PATH, DESTINATION_FOLDER_NAME);
const LOG_PATH = resolve(PROJECT_PATH, LOG_FOLDER_NAME);

const dataLake = {};

// PART OF RENAMING FILE
productsImageMap.forEach((productImageMap) => {
  const productId = productImageMap.ID;
  const productName = productImageMap.Nome;
  const productImageURL = productImageMap.Imagens;

  // check if product has multiple file name
  const fileArray = productImageURL.replace(/ /g, "").split(",");
  const isMultipleFile = fileArray.length > 1 ? true : false;

  if (isMultipleFile) {
    fileArray.forEach((_, i) => {
      const oldFileName = getOldName(fileArray[i]);
      const newFileName = getNewFileNameFromProductName(productName, i);

      const multipleImageContainer = [];

      multipleImageContainer.push({ oldFileName, newFileName, productName });

      multipleImageContainer.forEach((record) => {
        dataLake[oldFileName] = record;
        // dataLake.push(record);
      });
    });
  } else {
    const records = {};
    const oldFileName = getOldName(productImageURL);
    const newFileName = getNewFileNameFromProductName(productName);

    records["oldFileName"] = oldFileName;
    records["newFileName"] = newFileName;
    records["productName"] = productName;

    dataLake[oldFileName] = records;
    // dataLake.push(records);
  }

  //   console.log(oldFileName);

  function getNewFileNameFromProductName(sourceName, suffix) {
    if (!sourceName) {
      console.error(
        `getNewFileNameFromProductName - no source to elaborate for the product: ${productId}`
      );
      return;
    }

    const sourceNameInLowerCase = sourceName.toLowerCase();
    const sourceNameSanitized = sourceNameInLowerCase
      .replace(/\//g, "-")
      .replace(/ - /g, "-")
      .replace(/ /g, "-")
      .replace("(", "")
      .replace(")", "")
      .replace("+", "");

    let newFileName = sourceNameSanitized.replace(getPartOfNameToRemove(), "");

    if (suffix) {
      newFileName = `${newFileName}-${suffix}`;
    }

    return `${newFileName}${FILE_EXTENSION}`;
  }

  function getOldName(source) {
    if (!source) {
      console.error(
        `getOldName - no source to elaborate for the product: ${productId}`
      );
      return;
    }

    const oldName = source.replace(getPartOfNameToRemove(), "");

    return oldName;
  }

  function getPartOfNameToRemove() {
    return /http:\/\/localhost\/wikihost\/wp-content\/uploads\/[0-9][0-9][0-9][0-9]\/[0-9][0-9]\//g;
  }
});

// console.log(dataLake);

// // Get an array of the files inside the folder
const files = readdirSync(SOURCE_PATH);

// Loop through each file that was retrieved and rename
files.forEach((file) => {
  if (dataLake[file]) {
    const productDirectory = `${DESTINATION_PATH}/${dataLake[file]["productName"]}`;

    if (!existsSync(productDirectory)) {
      mkdirSync(productDirectory);
    }

    const sourceFileFullPath = `${SOURCE_PATH}/${file}`;
    const destinationFileFullPath = `${productDirectory}/${dataLake[file]["newFileName"]}`;

    rename(sourceFileFullPath, destinationFileFullPath, (err) =>
      console.log(err)
    );
  }
});
