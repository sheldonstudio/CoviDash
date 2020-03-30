# COVIDASH

The Coronavirus mobile-first dashboard.

## Requirements

* Node
* Yarn
* PHP

## Setup

To install all required dependencies and tools, please run the following command (from the project's folder)

    $ yarn

## Build

Run the following command for building the project for production usage.

    $ yarn package

## Development

During development, you'll most likely not deploy the resources to a PHP-capable web-server (in which case the data is downloaded and updated automatically), so you can generate the required dataset with the following command

    $ yarn dump-data

The following command can be used during development for building the project.

    $ yarn build

If you want to avoid running this command repeatedly, then you can the following two commands (the first one will compile the sources continuously while the second one serves the project on [http://0.0.0.0:8000](http://0.0.0.0:8000))

    $ yarn watch
    $ yarn serve
    
## Deployment

The built project in the `build` folder can be uploaded to the configured webspace (see `config.js`) that supports PHP scripts.

## License

See `/LICENSE.md` and `/src/fonts/LICENSE.pdf` for further details.