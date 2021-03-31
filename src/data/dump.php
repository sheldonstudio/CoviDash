<?php

require_once(__DIR__ . '/lib/italy.php');

$italy = new ItalyAdapter();

try {
  file_put_contents(__DIR__ . '/dataset.json', json_encode([
    'ITA' => $italy->getData()
  ]));
} catch (Exception $e) {
  echo($e);
}