<?php

define('ITALY_HASH_URL', 'https://api.github.com/repos/pcm-dpc/COVID-19/git/refs/heads/master');

$curl = curl_init();
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);
curl_setopt($curl, CURLOPT_USERAGENT, 'sheldonstudio/covidash');
curl_setopt($curl, CURLOPT_URL, ITALY_HASH_URL);

$hash = json_decode(curl_exec($curl));

curl_close($curl);

$hashFile = sprintf('%s/dataset.hash', __DIR__);
$datasetFile = sprintf('%s/dataset.tmp', __DIR__);

if (!file_exists($hashFile) || !file_exists($datasetFile) || file_get_contents($hashFile) != $hash->object->sha) {
    file_put_contents($hashFile, $hash->object->sha);

    ob_start();
    include(__DIR__.'/fetch.php');
    file_put_contents($datasetFile, ob_get_clean());
}

$json = file_get_contents($datasetFile);

header('Content-Type: application/json; charset=utf-8');
header('Content-Length: '.strlen($json));
header('Cache-Control: no-cache');
echo($json);