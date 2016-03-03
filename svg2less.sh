#!/bin/bash

cd www/css

>-icons.less

find svg -name "*.svg" | while read file
do
    VAR=`echo ${file} | sed "s|^svg/||; s|.svg$||; s|/|-|"`
    SVG=`cat $file | sed -n "/<svg.*/,/<\/svg>/p" | sed -e "/<g id=\"icomoon-ignore\">.*/,/<\/g>/d" | tr '\n' " " | sed "s|> |>|g; s| version=\"[^\"]*\"||; s| xmlns:xlink=\"[^\"]*\"||g" | sed "s|<path |<path fill=\"{C1}\" |"`
    echo "@svg-$VAR: '$SVG';" >> -icons.less
done
