const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', {willReadFrequently: true});
const imageFile = document.getElementById('image-file');
const colorsContainer = document.getElementById('colors-container');
const extractedColorInformation = document.getElementById('extracted-color-information-content');
const copyButton = document.getElementById('copy-btn');
const imageContainer = document.getElementById('image');
/* const pixelColor = document.getElementById('pixel-color'); */

const principalProcess = (img) => {
    const maxWidth = 550;
    const maxHeight = 350;

    let scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    let newWidth = img.width * scale;
    let newHeight = img.height * scale;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    imageContainer.classList.add('selected');

    const uniqueColors = getAllColors();
    showColors(uniqueColors);
}

window.onload = () => {
    let img = new Image();
    img.src = "assets/images/default.jpeg";

    img.onload = () => {
        principalProcess(img);
    }
}

imageFile.onchange = () => {
    if (imageFile.files.length > 0) {
        let file = imageFile.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            let img = new Image();
            img.src = reader.result;

            img.onload = () => {
                principalProcess(img);
            };
        };
    }
};

const showColors = (colors) => {
    colorsContainer.innerHTML = "";
    let colorInformation = ":root {"
    
    colors.forEach((color, index) => {
        const backgroundColor = document.createElement("div");
        const filter = document.createElement("div");
        const item = document.createElement("article");
        backgroundColor.className = "color-box";
        backgroundColor.style.backgroundColor = color;
        filter.className = "color-filter";
        filter.innerHTML = color;
        item.appendChild(backgroundColor);
        item.appendChild(filter);
        item.className = "color-item";
        colorInformation += `\n\t--color-${index + 1}: ${color};`
        colorsContainer.appendChild(item);
    });
    colorsContainer.focus();
    colorInformation += "\n}"
    extractedColorInformation.innerHTML = colorInformation;
}

const calcDistance = (color1, color2) => {
    const redDifference = color1[0] - color2[0];
    const greenDifference = color1[1] - color2[1];
    const blueDifference = color1[2] - color2[2];
    const distance = Math.sqrt((redDifference ** 2) + (greenDifference ** 2) + (blueDifference ** 2));
    return distance;
}

const sumColor = (color,  newColor) => {
    return [color[0] + newColor[0], color[1] + newColor[1], color[2] + newColor[2]];
}

const avgColor = (color, len) => {
    const avgRed = Math.round(color[0] / len);
    const avgGreen = Math.round(color[1] / len);
    const avgBlue = Math.round(color[2] / len);
    return [avgRed, avgGreen, avgBlue];
}

const filterColors = (uniqueColors, newColor, threshold = 56) => {
    let isANewColor = true;
    for (let i=0;  i<uniqueColors.length; i++) {
        const distance = calcDistance(uniqueColors[i]["avg"], newColor);
        if (distance < threshold) {
            uniqueColors[i]["sum"] = sumColor(uniqueColors[i]["sum"], newColor);
            uniqueColors[i]["total"] = uniqueColors[i]["total"] + 1;
            uniqueColors[i]["avg"] = avgColor(uniqueColors[i]["sum"], uniqueColors[i]["total"]);
            isANewColor = false
            break;
        }
    }

    if (isANewColor) {
        uniqueColors.push({"avg": newColor, "sum": newColor, "total": 1});
    }

    return uniqueColors;
}

const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase();
}

const getAllColors = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const colors = new Set();
    let uniqueColors = [];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        uniqueColors = filterColors(uniqueColors, [r, g, b]);    
    }
    
    //ORDER BY THE TOTAL OF EACH COLOR
    /*uniqueColors.sort((a, b) => {
        return b["total"]-a["total"]
    })*/
    

    //ORDER BY LUMINANCE OF EACH COLOR
    /*uniqueColors.sort((a, b) => {
        const lumn = ([r, g, b]) => 0.2126*r + 0.7152*g + 0.0722*b;
        return lumn(a["avg"]) - lumn(b["avg"]);
    })*/

    //ORDER BY AVERAGE OF EACH COLOR
    uniqueColors.sort((a, b) => {
        const avg = ([r, g, b]) => (r + g + b) / 3
        return avg(a["avg"]) - avg(b["avg"]);
    });
    
    for(const uniqueColor of uniqueColors) {
        const hex = rgbToHex(uniqueColor["avg"][0], uniqueColor["avg"][1], uniqueColor["avg"][2])
        colors.add(hex);
    }
    return Array.from(colors);
}

// THIS FUNCTION IS TO SHOW THE PIXEL SELECTED COLOR
/* canvas.addEventListener("click", function(e){
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX-rect.left;
    let y = e.clientY-rect.top;
    let data = ctx.getImageData(x, y, 1, 1).data;
    let rgb = [data[0], data[1], data[2]];
    pixelColor.value = rgbToHex(data[0], data[1], data[2]);
    pixelColor.click();
}); */

copyButton.addEventListener("click", async ()=> {
    const text = extractedColorInformation.innerHTML;
    if (text != "") {
        try{
            await navigator.clipboard.writeText(text);
            copyButton.innerHTML="Copied!";
            copyButton.disabled = true;
            setTimeout(() => {
                copyButton.innerHTML="Copy";
                copyButton.disabled = false;
            }, 5000);
        }catch(error){
            console.log(error);
        }
    }
});