// on flight track page e.g. below. open console and type this. copy the output.
// https://www.flightaware.com/live/flight/EZY3248/history/20251227/0710Z/EGPH/LFLS/tracklog
b=[];
a=$('tbody tr[class="smallrow1"], tbody tr[class="smallrow2"]').each((i,v)=>{
    t = $(v).children('td')
    c = ( {
"fa_flight_id": null,
"altitude": parseFloat(t[6].innerText.trim().replace(',',''))/100,
"altitude_change": parseFloat(t[7].innerText.trim().replace(',','')),
"groundspeed": parseInt(t[4].innerText.trim()),
"heading": parseInt(t[3].innerText.match(/\d+/)[0]),
"latitude": parseFloat(t[1].innerText.trim()),
"longitude": parseFloat(t[2].innerText.trim()),
"timestamp": '2025-12-27T'+t[0].innerText.split(' ')[1]+'Z' ,
"update_type": "A"
})
    b.push(c)
});
d=JSON.stringify(b)
console.log(d)