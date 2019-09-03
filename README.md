# rollup-plugin-sharp

A rollup plugin which scales and moves images to enable [gatsby-image](https://www.gatsbyjs.org/packages/gatsby-image/)-like image lazy-loading

## Usage

**Config**

```js
import sharp from 'rollup-plugin-sharp'

export default {
    ...
    plugins: [
        ...
        sharp({
            include: ["**/*.jpg"], // defaults to .svg, .png, .jpg and .gif files
            fileName: "[hash][extname]" // defaults to [name].[hash][extname]
        })
    ]
}
```

**Import**

```js
import image from "./image.jpg";

console.log(image.src); // public url to image i.e: image.ff84eb7eb7196ae2.jpg
console.log(image.placeholder); // data-url placeholder image, i.e: data:image/png;base64,iVBORw0KGgoAAAANSUhEU...
console.log(image.width); // height of the image in pixels, i.e 1024
console.log(image.height); // width of the image in pixels, i.e 1024
```

## Options

| Name          | Type                                    | Description                                                                      |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| include       | `string | RegExp | (string | RegExp)[]` | files to include                                                                 |
| exclude       | `string | RegExp | (string | RegExp)[]` | files to exclude                                                                 |
| publicPath    | `string`                                | public path for the `src` attribute                                              |
| destDir       | `string`                                | destination of the processed image files                                         |
| minifiedWidth | `string`                                | width of the minified placeholder image                                          |
| fileName      | `string`                                | template for the exported file names, accepts `[name]`, `[hash]` and `[extname]` |
