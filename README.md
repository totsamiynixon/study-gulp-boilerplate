# Gulp Boilerplate

## How to start

1. ```npm run watch```	 serves project to dist/dev with live reload;
2. ```npm run build```  builds project to dist/dev;
2. ```npm run build:prod```  builds project for production to dist/prod.

## How to use

All assets are placed in **src/assets** folder, it includes the next subfolders:

1. fonts - put your fonts here;
2. img - put your images/svg here;
3. js - here you should place app.js file. This template is only for simple landing pages where 1 js file is enough to contain all logic in the end file will be compiled to app.min.js file. Gulp task name: **js**;
4. sass - here you should place style.scss file. Use can use all sass featured, and in the end file will be compiled to style.min.css file. Gulp task name: **style**.

All libs file should be placed into appropriate libs folder:

1. js - for JavaScript library files;
2. css - for css library files;

It's not enough to just put files in a appropriate folder, sometimes files order is important, so when you put a file in a folder, you also should update libs section in **config** variable of gulpfile.js.
