## Getting Started

This Timeseries UI app is intended to show you how to request and plot time series data from the heatpump timeseries instance. Please note that another timeseries instance is available with ESB load & weather data and the seed-app is already configured to communicate with that instance.

### Get the source code
Make a directory for your project. Clone or download and extract this project in that directory.

```
bash
> git clone https://github.com/PredixDev/minds-machines-sf.git
> cd minds-machines-sf/Seed\ Apps/timeseries_seed_app
```

### Install tools
If you don't have them already, you'll need node, bower and gulp to be installed globally on your machine.  

1. Install [node](https://nodejs.org/en/download/).  This includes npm - the node package manager.  
2. Install [bower](https://bower.io/) globally `npm install bower -g`  
3. Install [gulp](http://gulpjs.com/) globally `npm install gulp -g`  

## App setup

After navigating to the timeseries_seed_app directory, install the dependencies.

```
bash
> npm install && bower install
```

To customize the application name do a global search and
replace of `your__app__title`.

`your__app__title` is the name used in user-facing files like `public/_index.html`.

## Running the app locally
The default gulp task will start a local web server.  Just run this command:
```
gulp
```
Browse to http://localhost:5000.
The app is already configured data to retrieve data from the shared time series instances.

If you want to link your local seed app to your team's Timeseries and UAA instances, copy over your **UAA URL** and **Timeseries ZoneId** (both unique to your instance) from *predix-scripts/log/quickstart-summary.txt*...

```
Predix Services Configuration
--------------------------------------------------
...
UAA URL: https://<your-uaa-identity>.predix-uaa.run.aws-usw02-pr.ice.predix.io
...
TimeSeries ZoneID: <your-unique-zone-id>
...
```
... then paste them into your node app's local-config.js (*timeseries_seed_app/server/local-config.js*)

```
"predix-timeseries": [
    {
        ...
        "credentials": {
            "query": {
                ...
                "zone-http-header-value": "{The Zone ID for the Timeseries Service Created in your space}"
            }
        }
    }
],
"predix-uaa": [
    {
        ...
        "credentials": {
            "uri": "{The UAA URI end point in your space to get auth token}"
        }
    }
],
```

## Running in Predix Cloud

### Pre-Requisites
Before pushing your app to the cloud, ensure that your team space is setup by following the [How To Setup Your Predix Space](https://github.com/PredixDev/minds-machines-sf/blob/master/How%20To%20Setup%20Your%20Predix%20Space.md) guide. You can also find information on the services in your space there.

Pushing (deploying) to a cloud environment requires knowledge of the commands involved and a valid user account with the environment.  GE uses Cloud Foundry for its cloud platform.  For information on Cloud Foundry, refer to this [link](http://docs.cloudfoundry.org/cf-cli/index.html).


### Steps
The simplest way to push the Timeseries seed app to a cloud environment is by modifying the manifest file (manifest.yml) and using the **cf push** command, as follows:

1. Update manifest.yml

    Change the name field in your manifest.yml.
    The service names below are configured to match those deployed by the quickstart script. They will be bound to your app after deploying.
    ```
    ---
    applications:
      - name: MMSanFrancisco-ui
        memory: 512M
        buildpack: nodejs_buildpack
        command: node server/app.js
        path: dist

    services:
     - mmsanfranciscoteam-time-series
     - mmsanfranciscoteam-uaa
     - MMSanFrancisco_uaa_admin
     - MMSanFrancisco_timeseries_heatPump
     - MMSanFrancisco_timeseries_loadData

    env:
        node_env: cloud
        clientId: app_client_id
        clientSecret: secret

    ```

2. Push to the cloud.

    ```
    cf push
    ```

3. Access the cloud deployment of your Starter application

  The output of the **cf push** command includes the URL to which your application was deployed.  Below is an example:

    ```
    Showing health and status for app MMSanFrancisco-ui in org my-org / space dev as developer@gmail.com...
    OK

    requested state: started
    instances: 1/1
    usage: 512M x 1 instances
    urls: mmsanfrancisco-ui.run.aws-usw02-pr.ice.predix.io
    last uploaded: Wed Oct 10 23:40:10 UTC 2017
    stack: cflinuxfs2
    buildpack: nodejs_buildpack

    state     since                    cpu    memory          disk           details
    #0   running   2017-10-10 04:41:12 PM   0.0%   57.9M of 512M   126.6M of 1G
    ```  

  Access your Starter application by adding "https://" to the beginning of the URL, and loading that URL in a web browser.
