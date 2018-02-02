# MMM-PublicTransportLeipzig

MMM-PublicTransportLeipzig is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by 
[Michael Teeuw](https://github.com/MichMich).

It shows live public transport information for Leibzig based on LVB (Leipziger Verkehrsbetriebe) data.  
MMM-PublicTransportLeipzig uses the [lvb](https://github.com/juliuste/lvb) REST API by [juliuste](https://github.com/juliuste).

**Notes:** 
*The module is working fine. But there are some known issues. (See [Known Issues](#Known-Issues).)*

## How it works
After you installed MMM-PublicTransportLeipzig you just configure it to your needs and that’s it. The only config you really need to set is the station you want to display. Everything else is covered by defaults but can be configured by you anyway. For instance you can enter a time you need to get to the station (``timeToStation`` in config). Then the module calculates the next reachable departures and draws a line between reachable and unreachable departures.

For details see the [Configuration](#configuration) section.

## Screenshot

![Example for Wilhelm-Leuschner-Platz with time to station](img/MMM-PublicTransport_screenshot.png)

The screenshot shows departures from Wilhelm-Leuschner-Platz where the first two are not reachable due to the ``timeToStation`` setting.

## Preconditions

* MagicMirror<sup>2</sup> instance
* Node.js version > 6.0.0
* npm

## Installation

Just clone the module into your MagicMirror modules folder and execute `npm install` in the module's directory:

```
git clone https://github.com/raywo/MMM-PublicTransportLeipzig.git
cd MMM-PublicTransportLeipzig
npm install
```

## Update

Just enter your MMM-PublicTransportLeipzig folder in the MagicMirror's modules folder and execute the following commands in the module's directory:

```
git pull
npm install
```

## How to get the `stationId`

You can provide a station name or a station ID to define your departure station. If your station has a `stationID` it is recommended to use it. If not you can be lucky and get away with just providing the station name. (See [Known Issues](#Knwon-Issues).)

For your convenience there is a script in the MMM-PublicTransportLeipzig folder you can edit and execute to get the `stationID` for your station.

Find the file `stationID_Query.js` and edit the second line and fill in the name of your station: 

```
// Enter your station name here:
const stationName = "Goerdelerring";
```

The result will look like this:

```
[ { id: '12996',
    type: 'station',
    name: 'Leipzig, Goerdelerring',
    coordinates: { longitude: 12.372838780123, latitude: 51.344361907514 } } ]
```

The number noted after `id` is your `stationID` (in this case 12996).

If this query returns more than one result you have to pick the right station and you must provide the `stationID` in the config or else the module won’t work.    

For some station names the query will return `[]`. This means the station is not known by the api.


## Configuration

The module quite configurable. These are the possible options:

|Option|Description|
|---|---|
|`name`|The name of the module instance (if you want multiple modules).<br><br>**Type:** `string`<br>|
|`stationId`|The ID of the station. How to get the ID for your station is described below.<br><br>**Type:** `integer` This value is **Required**.|
|`ignoredStations`|To allow appearance of multiple transportation methods, `vbb-hafas` returns departures of multiple stations in the area of the main station (including bus and tram stations for example). You can exclude those stations by adding them to this array. Usually, this can be empty.<br><br>**Type:** `integer array` (comma separated `integers` in the array).<br>**Default value:** `<empty>`|
|`directionStationId`|If you want the module to show departures only in a specific direction, you can enter the ID of the next station on your line to specify the direction. <br><br> *Note: After some tests, the data delivery of this feature seems not to be as reliable as the normal version. Also, please make sure you actually have the right `stationId` for the direction station. Please check your MagicMirror log for errors before reporting them. <br> Additionally, more request results take more time for the request. So please make sure to keep your `maxUnreachableDepartures` and `maxReachabledepartures` low when using this feature.* <br><br> **Type:** `integer` <br>**Default value:** `nonexistent`|
|`ignoredLines`|You can exclude different lines of a station by adding them to this array. Usually, this can be empty.<br><br>**Type:** `string array` (comma separated `strings` in the array).<br>**Default value:** `<empty>` <br>**Possible values:** All valid line names like `'U5'` (for subway) , `'M10'` or `'21'` (for tram), `'S75'` (for suburban) , `'200'`(for bus), etc.|
|`excludedTransportationTypes`|Transportation types to be excluded from appearing on a module instance can be listed here.<br><br>**Type:** `string`, comma-separated list<br>**Default vaule:** `<empty>` <br>**Possible values:** `bus`, `tram`, `suburban`, `subway`, `regional`, `ferry`|
|`marqueeLongDirections`|Makes a marquee/ticker text out of all direction descriptions with more than 25 characters. If this value is false, the descriptions are trimmed to the station names. You can see a video of it [here](https://ds.kayuk.de/kAfzU/) (rendered by a regular computer).<br><br> *Note: The rendering on the mirror is not perfect, but it is OK in my opinion. If the movement is not fluent enough for you, you should turn it off.*<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`interval`|How often the module should be updated. The value is given in milliseconds.<br><br>**Type:** `integer`<br>**Default value:** `120000 // 2 minutes`|
|`hidden`|Visibility of the module.<br><br>**Type:** `boolean`<br>**Default vaule:** `false`|
|`delay`|How long does it take you to get from the mirror to the station? The value is given in minutes.<br><br>**Type:** `integer`<br>**Default vaule:** `10 // 10 minutes`|
|`departureMinutes`|For how many minutes in the future should departures be fetched? If `delay` is set > 0, then this time will be added to `now() + delay`. (This could be obsolete in future versions but is needed for now.)<br><br>**Type:** `integer`<br>**Default vaule:** `10`|
|`showColoredLineSymbols`|If you want the line colored and shaped or text only.<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`useColorForRealtimeInfo`|Set colors for realtime information<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`showTableHeaders`|Show or hides the table headers.<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`showTableHeadersAsSymbols`|Show the table headers as text or symbols.<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`maxUnreachableDepartures`|How many unreachable departures should be shown. Only necessary, of you set `delay` > 0<br><br>**Type:** `integer`<br>**Default vaule:** `3`|
|`maxReachableDepartures`|How many reachable departures should be shown. If your `delay = 0`, this is the value for the number of departures you want to see.<br><br>**Type:** `integer`<br>**Default vaule:** `7`|
|`fadeUnreachableDepartures`|Activates/deactivates fading for unreachable departures.<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`fadeReachableDepartures`|Activates/deactivates fading for reachable departures.<br><br>**Type:** `boolean`<br>**Default vaule:** `true`|
|`fadePointForReachableDepartures`|Fading point for reachable departures. Thìs value is also valid for `delay = 0` <br><br>**Type:** `float`<br>**Default vaule:** `0.5` <br>**Possible values:** `0.0 - 1.0`|

Here is an example of an entry in `config.js`:

``` JavaScript
{
    module: 'MMM-PublicTransportLeipzig',
    position: 'top_right',
    config: {
        name: "Alexanderplatz",
        stationId: 900000100003,
        hidden: false,
        ignoredStations: [900000100003,2342,1337],
        ignoredLines: ['U5', 'U8', 'S75'],               
        excludedTransportationTypes: 'bus,suburban,subway',   
        delay: 10,
        interval: 120000,
        departureMinutes: 10,          
        maxDepartures: 15,
        marqueeLongDirections: true,
        showColoredLineSymbols: true,  
        useColorForRealtimeInfo: true,
        showTableHeaders: true,
        showTableHeadersAsSymbols: true,
        maxUnreachableDepartures: 3,    
        maxReachableDepartures: 7,
        fadeUnreachableDepartures: true,
        fadeReachableDepartures: true,
        fadePointForReachableDepartures: 0.25
    }
},
```

## Multiple Modules

Multiple instances of this module are possible. Just add another entry of the MMM-PublicTransportLeipzig module to the `config.js` of your mirror.

## Special Thanks

* [Michael Teeuw](https://github.com/MichMich) for inspiring me and many others to build a MagicMirror.
* [Jannis Redmann](https://github.com/derhuerst) for creating the [vbb-hafas](https://github.com/derhuerst/vbb-hafas) REST API. 
You made my life a lot easier with this!
* The community of [magicmirror.builders](https://magicmirror.builders) for help in the development process and all contributors for finding and fixing errors in this module.


## Known Issues
The API the LVB (Leipziger Verkehrsbetriebe) provides is very basic and has some issues:

* Not all stations have a `stationID` assigned (for instance “Klingerweg”).
* Some stations are stored with unusal names. For instance “Nonnenstraße” is stored as “Nonnenstr.”
* Most station which are also suburban (S-Bahn) or long distance train stops cannot be queried.

Stations without an assigned `stationID` can be used as starting points for the module as long as a query for their name returns a single result. In the example above “Klingerweg” has no `stationID` assigned but a stations query for “Klingerweg” returns just one result so it can be used. On the other hand it is not possible to set “Hauptbahnhof” as a starting point for the module. Since “Hauptbahnhof” has no `stationID` assigned and a station query returns multiple results.

## Issues

If you find any problems, bugs or have questions, please [open a GitHub issue](https://github.com/deg0nz/MMM-PublicTransportLeipzig/issues) in this repository.
