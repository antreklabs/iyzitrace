export const randomBackgroundGradient = (): string => {
    
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFA133', '#33FFA1', '#A133FF', '#FF33FF', '#FF5733', '#33FF57'];

    const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

    const color1 = getRandomColor();
    let color2 = getRandomColor();

    while (color1 === color2) {
        color2 = getRandomColor();
    }

    const directions = ['to right', 'to bottom', '135deg', 'to top right', 'to left'];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    return `linear-gradient(${direction}, ${color1}, ${color2})`;
};

export const createGradient = (color1: string, color2: string): string => {
    const directions = ['to right', 'to bottom', '135deg', 'to top right', 'to left'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    return `linear-gradient(${direction}, ${color1}, ${color2})`;
}

export const getRandomColorTwice = ()=>{
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFA133', '#33FFA1', '#A133FF', '#FF33FF', '#FF5733', '#33FF57'];

    const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

    const color1 = getRandomColor();
    let color2 = getRandomColor();

    while (color1 === color2) {
        color2 = getRandomColor();
    }
    return [color1, color2];
}

export const randomBackgroundColor = (): string => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFA133', '#33FFA1', '#A133FF', '#FF33FF', '#FF5733', '#33FF57'];
    return colors[Math.floor(Math.random() * colors.length)];
};
export const randomTextColor = (): string => {
    const colors = ['#FFFFFF', '#000000', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFA133', '#33FFA1', '#A133FF', '#FF33FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}