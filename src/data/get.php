<?php

require_once(__DIR__ . '/lib/italy.php');

$italy = new ItalyAdapter();

$hash = $italy->getChecksum();

$hashFile = sprintf('%s/dataset.hash', __DIR__);
$datasetFile = sprintf('%s/dataset.tmp', __DIR__);

if (!file_exists($hashFile) || !file_exists($datasetFile) || file_get_contents($hashFile) != $hash) {
  file_put_contents($hashFile, $hash);

  file_put_contents($datasetFile, json_encode([
      'ITA' => $italy->getData()
  ]));
}

$json = file_get_contents($datasetFile);

header('Content-Type: application/json; charset=utf-8');
header('Content-Length: ' . strlen($json));
header('Cache-Control: no-cache');
echo($json);
