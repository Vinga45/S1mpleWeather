document.addEventListener("DOMContentLoaded", function(){
    
const API_KEY = '691ba428c2d24a44bd9114339260808 '; 

async function getWeatherArray(cityName) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(cityName)}&days=2&lang=uk`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Місто не знайдено');

    const data = await response.json();
    const days = data.forecast.forecastday;

    // Формуємо масив з ключами day1 та day2
    const weatherArray = [
      {
        day1: {
          date: days[0].date,
          temp_min: days[0].day.mintemp_c,
          temp_max: days[0].day.maxtemp_c,
          condition: days[0].day.condition.text,
          chance_of_rain: days[0].day.daily_chance_of_rain
        }
      },
      {
        day2: {
          date: days[1].date,
          temp_min: days[1].day.mintemp_c,
          temp_max: days[1].day.maxtemp_c,
          condition: days[1].day.condition.text,
          chance_of_rain: days[1].day.daily_chance_of_rain
        }
      }
    ];

    return weatherArray;

  } catch (error) {
    console.error('Помилка:', error.message);
    return null;
  }
}

// Приклад використання з вводом міста від користувача:
const userCity = prompt('Введіть місто:');

if (userCity) {
  getWeatherArray(userCity).then(result => {
    console.log(result);
  });
}
})