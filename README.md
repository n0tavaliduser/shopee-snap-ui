# Shopee Scraper Web UI

This project is the frontend user interface for the Shopee Selenium Scrapper. It was bootstrapped using Vite.

## Project Setup

The project was initially created using the following command:
```bash
npm create vite@latest web-ui --template vanilla
```
*(Note: It has been configured with TypeScript as well).*

## Dependencies

This frontend relies on the following major development dependencies:
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [TypeScript](https://www.typescriptlang.org/) - For static type-checking
- [Tailwind CSS](https://tailwindcss.com/) (along with PostCSS and Autoprefixer) - For utility-first styling

## Installation

To set up the project locally, make sure you have [Node.js](https://nodejs.org/) installed, and then run:

```bash
npm install
```

## Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in the development mode. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`
Builds the app for production to the `dist` folder. It runs the TypeScript compiler `tsc` before bundling with `vite build`.

### `npm run preview`
Boot up a local static web server that serves the files from the `dist` folder at [http://localhost:4173](http://localhost:4173). It's an easy way to check if the production build looks OK in your local environment.
