<?php

define('ITALY_HASH_URL', 'https://api.github.com/repos/pcm-dpc/COVID-19/git/refs/heads/master');
define('ITALY_COUNTRY_DATA_URL', 'https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-andamento-nazionale.json');
define('ITALY_STATES_DATA_URL', 'https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json');
define('ITALY_AREAS_DATA_URL', 'https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-province.json');

$country = json_decode(file_get_contents(ITALY_COUNTRY_DATA_URL));
$states = json_decode(file_get_contents(ITALY_STATES_DATA_URL));
$areas = json_decode(file_get_contents(ITALY_AREAS_DATA_URL));

function parseAreaData($areaName) {
    global $areas;

    $areaEntries = array_filter($areas, function ($area) use ($areaName) {
        return $area->denominazione_provincia == $areaName;
    });

    $data = [
        'type' => 'area',
        'name' => $areaName,
        'updates' => [
            'latest' => null,
            'previous' => null,
        ],
        'positives' => [
            'total' => null,
            'delta' => null,
        ],
        'recovered' => [
            'total' => null,
            'delta' => null,
        ],
        'deceased' => [
            'total' => null,
            'delta' => null,
        ],
        'swabs' => [
            'total' => null,
            'delta' => null,
        ],
    ];

    $entries = $areaEntries;

    usort($entries, function($a, $b) {
        return strcmp($b->data, $a->data);
    });

    $latestUpdate = null;
    $previousUpdate = null;

    if (count($entries) > 0) {
        $latestUpdate = $entries[0];

        $data['updates']['latest'] = $latestUpdate->data;
    }

    if (count($entries) > 1) {
        $previousUpdate = $entries[1];

        $data['updates']['previous'] = $previousUpdate->data;
    }

    if (!empty($latestUpdate)) {
        $data['positives']['total'] = (int) $latestUpdate->totale_casi;
    }

    if (!empty($previousUpdate)) {
        $data['positives']['delta'] = $data['positives']['total'] - (int) $previousUpdate->totale_casi;
    }

    $entries = $areaEntries;

    usort($entries, function($a, $b) {
        return strcmp($a->data, $b->data);
    });

    $data['timeline'] = array_map(function($entry) {
        return [
            $entry->data,
            (int) $entry->totale_casi
        ];
    }, $entries);

    return $data;
}

function parseStateData($stateName) {
    global $states, $areas;

    $stateEntries = array_filter($states, function ($state) use ($stateName) {
        return $state->denominazione_regione == $stateName;
    });

    $data = [
        'type' => 'state',
        'name' => $stateName,
        'updates' => [
            'latest' => null,
            'previous' => null,
        ],
        'positives' => [
            'total' => null,
            'delta' => null,
        ],
        'recovered' => [
            'total' => null,
            'delta' => null,
        ],
        'deceased' => [
            'total' => null,
            'delta' => null,
        ],
        'swabs' => [
            'total' => null,
            'delta' => null,
        ],
    ];

    $entries = $stateEntries;

    usort($entries, function($a, $b) {
        return strcmp($b->data, $a->data);
    });

    $latestUpdate = null;
    $previousUpdate = null;

    if (count($entries) > 0) {
        $latestUpdate = $entries[0];

        $data['updates']['latest'] = $latestUpdate->data;
    }

    if (count($entries) > 1) {
        $previousUpdate = $entries[1];

        $data['updates']['previous'] = $previousUpdate->data;
    }

    if (!empty($latestUpdate)) {
        $data['positives']['total'] = (int) $latestUpdate->totale_casi;
        $data['recovered']['total'] = (int) $latestUpdate->dimessi_guariti;
        $data['deceased']['total'] = (int) $latestUpdate->deceduti;
        $data['swabs']['total'] = (int) $latestUpdate->tamponi;
    }

    if (!empty($previousUpdate)) {
        $data['positives']['delta'] = $data['positives']['total'] - (int) $previousUpdate->totale_casi;
        $data['recovered']['delta'] = $data['recovered']['total'] - (int) $previousUpdate->dimessi_guariti;
        $data['deceased']['delta'] = $data['deceased']['total'] - (int) $previousUpdate->deceduti;
        $data['swabs']['delta'] = $data['swabs']['total'] - (int) $previousUpdate->tamponi;
    }

    $entries = $stateEntries;

    usort($entries, function($a, $b) {
        return strcmp($a->data, $b->data);
    });

    $data['timeline'] = array_map(function($entry) {
        return [
            $entry->data,
            (int) $entry->totale_casi,
            (int) $entry->dimessi_guariti,
            (int) $entry->deceduti,
            (int) $entry->tamponi
        ];
    }, $entries);

    $data['children'] = array_map(function ($areaName) {
        return parseAreaData($areaName);
    }, array_values(array_unique(array_map(function ($area) {
        return $area->denominazione_provincia;
    }, array_values(array_filter($areas, function ($area) use($stateName) {
        return $area->stato == 'ITA' && $area->denominazione_regione == $stateName && (!empty($area->lat) && !empty($area->long));
    }))))));

    return $data;
}

function parseCountryData() {
    global $country, $states;

    $entries = $country;

    usort($entries, function($a, $b) {
        return strcmp($b->data, $a->data);
    });

    $data = [
        'type' => 'country',
        'name' => [
            'it' => 'Italia',
            'en' => 'Italy',
        ],
        'updates' => [
            'latest' => null,
            'previous' => null,
        ],
        'positives' => [
            'total' => null,
            'delta' => null,
        ],
        'recovered' => [
            'total' => null,
            'delta' => null,
        ],
        'deceased' => [
            'total' => null,
            'delta' => null,
        ],
        'swabs' => [
            'total' => null,
            'delta' => null,
        ],
        'tags' => [
            [
                'id' => '#north',
                'name' => [
                    'it' => 'Regioni settentrionali',
                    'en' => 'Northern regions',
                ],
                'states' => [
                    'Emilia Romagna',
                    'Friuli Venezia Giulia',
                    'Lombardia',
                    'P.A. Trento',
                    'P.A. Bolzano',
                    'Piemonte',
                    'Valle d\'Aosta',
                    'Veneto',
                ],
            ],
            [
                'id' => '#centre',
                'name' => [
                    'it' => 'Regioni centrali',
                    'en' => 'Northern regions',
                ],
                'states' => [
                    'Lazio',
                    'Marche',
                    'Toscana',
                    'Umbria',
                ],
            ],
            [
                'id' => '#south',
                'name' => [
                    'it' => 'Regioni meridionali',
                    'en' => 'Central regions',
                ],
                'states' => [
                    'Abruzzo',
                    'Basilicata',
                    'Calabria',
                    'Campania',
                    'Liguria',
                    'Molise',
                    'Puglia',
                ],
            ],
            [
                'id' => '#islands',
                'name' => [
                    'it' => 'Regioni insulari',
                    'en' => 'Islands',
                ],
                'states' => [
                    'Sardegna',
                    'Sicilia',
                ],
            ],
        ],
    ];

    $latestUpdate = null;
    $previousUpdate = null;

    if (count($entries) > 0) {
        $latestUpdate = $entries[0];

        $data['updates']['latest'] = $latestUpdate->data;
    }

    if (count($entries) > 1) {
        $previousUpdate = $entries[1];

        $data['updates']['previous'] = $previousUpdate->data;
    }

    if (!empty($latestUpdate)) {
        $data['positives']['total'] = (int) $latestUpdate->totale_casi;
        $data['recovered']['total'] = (int) $latestUpdate->dimessi_guariti;
        $data['deceased']['total'] = (int) $latestUpdate->deceduti;
        $data['swabs']['total'] = (int) $latestUpdate->tamponi;
    }

    if (!empty($previousUpdate)) {
        $data['positives']['delta'] = $data['positives']['total'] - (int) $previousUpdate->totale_casi;
        $data['recovered']['delta'] = $data['recovered']['total'] - (int) $previousUpdate->dimessi_guariti;
        $data['deceased']['delta'] = $data['deceased']['total'] - (int) $previousUpdate->deceduti;
        $data['swabs']['delta'] = $data['swabs']['total'] - (int) $previousUpdate->tamponi;
    }

    $entries = $country;

    usort($entries, function($a, $b) {
        return strcmp($a->data, $b->data);
    });

    $data['timeline'] = array_map(function($entry) {
        return [
            $entry->data,
            (int) $entry->totale_casi,
            (int) $entry->dimessi_guariti,
            (int) $entry->deceduti,
            (int) $entry->tamponi
        ];
    }, $entries);

    $data['children'] = array_map(function($stateName) {
        return parseStateData($stateName);
    }, array_values(array_unique(array_map(function($state) {
        return $state->denominazione_regione;
    }, array_values(array_filter($states, function($state) {
        return $state->stato == 'ITA';
    }))))));

    return $data;
}

echo(json_encode([
  'ITA' => parseCountryData()
]));