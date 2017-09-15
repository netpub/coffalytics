<?php

// This is just an example of reading server side data and sending it to the client.
// It reads a json formatted text file and outputs it.
$apiUrl = "https://api.network-publishing.de/coffee/";
$string = file_get_contents($apiUrl.$_GET['start'].'/'.$_GET['end']);
echo $string;
