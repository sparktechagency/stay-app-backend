export const imageFormatHelper = (images:string[])=>{
    return images.map(image=>image.replace('{size}', '1024x768'));
}