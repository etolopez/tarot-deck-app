/**
 * Static Card Image Mapping
 * Maps card image paths to require() calls for Expo asset loading
 * 
 * This is necessary because Expo doesn't support dynamic require()
 * All images must be statically referenced
 */

// Major Arcana (00-21)
// Using assets folder which is the proper location for Expo
const majorArcana = {
  "00-TheFool.jpg": require("../../assets/Cards-jpg/00-TheFool.jpg"),
  "01-TheMagician.jpg": require("../../assets/Cards-jpg/01-TheMagician.jpg"),
  "02-TheHighPriestess.jpg": require("../../assets/Cards-jpg/02-TheHighPriestess.jpg"),
  "03-TheEmpress.jpg": require("../../assets/Cards-jpg/03-TheEmpress.jpg"),
  "04-TheEmperor.jpg": require("../../assets/Cards-jpg/04-TheEmperor.jpg"),
  "05-TheHierophant.jpg": require("../../assets/Cards-jpg/05-TheHierophant.jpg"),
  "06-TheLovers.jpg": require("../../assets/Cards-jpg/06-TheLovers.jpg"),
  "07-TheChariot.jpg": require("../../assets/Cards-jpg/07-TheChariot.jpg"),
  "08-Strength.jpg": require("../../assets/Cards-jpg/08-Strength.jpg"),
  "09-TheHermit.jpg": require("../../assets/Cards-jpg/09-TheHermit.jpg"),
  "10-WheelOfFortune.jpg": require("../../assets/Cards-jpg/10-WheelOfFortune.jpg"),
  "11-Justice.jpg": require("../../assets/Cards-jpg/11-Justice.jpg"),
  "12-TheHangedMan.jpg": require("../../assets/Cards-jpg/12-TheHangedMan.jpg"),
  "13-Death.jpg": require("../../assets/Cards-jpg/13-Death.jpg"),
  "14-Temperance.jpg": require("../../assets/Cards-jpg/14-Temperance.jpg"),
  "15-TheDevil.jpg": require("../../assets/Cards-jpg/15-TheDevil.jpg"),
  "16-TheTower.jpg": require("../../assets/Cards-jpg/16-TheTower.jpg"),
  "17-TheStar.jpg": require("../../assets/Cards-jpg/17-TheStar.jpg"),
  "18-TheMoon.jpg": require("../../assets/Cards-jpg/18-TheMoon.jpg"),
  "19-TheSun.jpg": require("../../assets/Cards-jpg/19-TheSun.jpg"),
  "20-Judgement.jpg": require("../../assets/Cards-jpg/20-Judgement.jpg"),
  "21-TheWorld.jpg": require("../../assets/Cards-jpg/21-TheWorld.jpg"),
};

// Minor Arcana - Wands (01-14)
const wands = {
  "Wands01.jpg": require("../../assets/Cards-jpg/Wands01.jpg"),
  "Wands02.jpg": require("../../assets/Cards-jpg/Wands02.jpg"),
  "Wands03.jpg": require("../../assets/Cards-jpg/Wands03.jpg"),
  "Wands04.jpg": require("../../assets/Cards-jpg/Wands04.jpg"),
  "Wands05.jpg": require("../../assets/Cards-jpg/Wands05.jpg"),
  "Wands06.jpg": require("../../assets/Cards-jpg/Wands06.jpg"),
  "Wands07.jpg": require("../../assets/Cards-jpg/Wands07.jpg"),
  "Wands08.jpg": require("../../assets/Cards-jpg/Wands08.jpg"),
  "Wands09.jpg": require("../../assets/Cards-jpg/Wands09.jpg"),
  "Wands10.jpg": require("../../assets/Cards-jpg/Wands10.jpg"),
  "Wands11.jpg": require("../../assets/Cards-jpg/Wands11.jpg"),
  "Wands12.jpg": require("../../assets/Cards-jpg/Wands12.jpg"),
  "Wands13.jpg": require("../../assets/Cards-jpg/Wands13.jpg"),
  "Wands14.jpg": require("../../assets/Cards-jpg/Wands14.jpg"),
};

// Minor Arcana - Cups (01-14)
const cups = {
  "Cups01.jpg": require("../../assets/Cards-jpg/Cups01.jpg"),
  "Cups02.jpg": require("../../assets/Cards-jpg/Cups02.jpg"),
  "Cups03.jpg": require("../../assets/Cards-jpg/Cups03.jpg"),
  "Cups04.jpg": require("../../assets/Cards-jpg/Cups04.jpg"),
  "Cups05.jpg": require("../../assets/Cards-jpg/Cups05.jpg"),
  "Cups06.jpg": require("../../assets/Cards-jpg/Cups06.jpg"),
  "Cups07.jpg": require("../../assets/Cards-jpg/Cups07.jpg"),
  "Cups08.jpg": require("../../assets/Cards-jpg/Cups08.jpg"),
  "Cups09.jpg": require("../../assets/Cards-jpg/Cups09.jpg"),
  "Cups10.jpg": require("../../assets/Cards-jpg/Cups10.jpg"),
  "Cups11.jpg": require("../../assets/Cards-jpg/Cups11.jpg"),
  "Cups12.jpg": require("../../assets/Cards-jpg/Cups12.jpg"),
  "Cups13.jpg": require("../../assets/Cards-jpg/Cups13.jpg"),
  "Cups14.jpg": require("../../assets/Cards-jpg/Cups14.jpg"),
};

// Minor Arcana - Swords (01-14)
const swords = {
  "Swords01.jpg": require("../../assets/Cards-jpg/Swords01.jpg"),
  "Swords02.jpg": require("../../assets/Cards-jpg/Swords02.jpg"),
  "Swords03.jpg": require("../../assets/Cards-jpg/Swords03.jpg"),
  "Swords04.jpg": require("../../assets/Cards-jpg/Swords04.jpg"),
  "Swords05.jpg": require("../../assets/Cards-jpg/Swords05.jpg"),
  "Swords06.jpg": require("../../assets/Cards-jpg/Swords06.jpg"),
  "Swords07.jpg": require("../../assets/Cards-jpg/Swords07.jpg"),
  "Swords08.jpg": require("../../assets/Cards-jpg/Swords08.jpg"),
  "Swords09.jpg": require("../../assets/Cards-jpg/Swords09.jpg"),
  "Swords10.jpg": require("../../assets/Cards-jpg/Swords10.jpg"),
  "Swords11.jpg": require("../../assets/Cards-jpg/Swords11.jpg"),
  "Swords12.jpg": require("../../assets/Cards-jpg/Swords12.jpg"),
  "Swords13.jpg": require("../../assets/Cards-jpg/Swords13.jpg"),
  "Swords14.jpg": require("../../assets/Cards-jpg/Swords14.jpg"),
};

// Minor Arcana - Pentacles (01-14)
const pentacles = {
  "Pentacles01.jpg": require("../../assets/Cards-jpg/Pentacles01.jpg"),
  "Pentacles02.jpg": require("../../assets/Cards-jpg/Pentacles02.jpg"),
  "Pentacles03.jpg": require("../../assets/Cards-jpg/Pentacles03.jpg"),
  "Pentacles04.jpg": require("../../assets/Cards-jpg/Pentacles04.jpg"),
  "Pentacles05.jpg": require("../../assets/Cards-jpg/Pentacles05.jpg"),
  "Pentacles06.jpg": require("../../assets/Cards-jpg/Pentacles06.jpg"),
  "Pentacles07.jpg": require("../../assets/Cards-jpg/Pentacles07.jpg"),
  "Pentacles08.jpg": require("../../assets/Cards-jpg/Pentacles08.jpg"),
  "Pentacles09.jpg": require("../../assets/Cards-jpg/Pentacles09.jpg"),
  "Pentacles10.jpg": require("../../assets/Cards-jpg/Pentacles10.jpg"),
  "Pentacles11.jpg": require("../../assets/Cards-jpg/Pentacles11.jpg"),
  "Pentacles12.jpg": require("../../assets/Cards-jpg/Pentacles12.jpg"),
  "Pentacles13.jpg": require("../../assets/Cards-jpg/Pentacles13.jpg"),
  "Pentacles14.jpg": require("../../assets/Cards-jpg/Pentacles14.jpg"),
};

// Card Back
const cardBack = {
  "CardBacks.jpg": require("../../assets/Cards-jpg/CardBacks.jpg"),
};

/**
 * Combined image map
 * Maps filename to require() result
 */
const imageMap: Record<string, any> = {
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles,
  ...cardBack,
};

/**
 * Get image source for a card image filename
 * Returns the require() result for the image
 */
export function getCardImageSource(imagePath: string): any {
  const image = imageMap[imagePath];
  if (!image) {
    // Fallback to card back if image not found
    return cardBack["CardBacks.jpg"];
  }
  return image;
}

