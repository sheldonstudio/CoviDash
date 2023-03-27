<?php

require_once(__DIR__ . '/lib/italy.php');

$italy = new ItalyAdapter();

try {
  $data = $italy->getData();

  file_put_contents(__DIR__ . '/dataset.json', json_encode([
    'ITA' => $data
  ]));
} catch (Exception $e) {
  echo($e);
}