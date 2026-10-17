// DIGITAL CLOCK PROGRAM


function updateClock() {
    const now = new Date();      // To get the  current date 

    let hours = now.getHours().toString().padStart(2,0);
    const minutes = now.getMinutes().toString().padStart(2,0);
    const seconds = now.getSeconds().toString().padStart(2,0);       // note: .toString().padStart(2,0) helps us to let the date to be in 2 digit format e.g let's say the hour time is 8 o'clock, it will appear as 08 and not 8


        const meridian = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;   // to not make it military time(e.g if the time is 2pm, the hour time should show 2 and not 14)
        hours = hours.toString().padStart(2,0);

    
    
    const timeString = `${hours}:${minutes}:${seconds} ${meridian}`;
    document.getElementById("clock").textContent = timeString;

}


updateClock();


setInterval(updateClock, 1000);   
// To get the clock update every second (recall: setInterval function is used to call a function repeatedly), so we are going to call the updateClock function(which will serve as a callback func.) repeatedly after 1 sec or 1000milliseconds