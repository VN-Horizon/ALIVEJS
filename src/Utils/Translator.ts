
function plainizeText(text: string | null | undefined) {
  if (text === undefined || text === null) return "";
  return String(text).replace(/\s+/g, "");
}

export async function initTranslation() {
  try {
    const response = await fetch("./assets/events/translation.bin");
    if (!response.ok) {
      console.error("Failed to fetch file:", response.statusText);
      return;
    }
    const buffer = await response.arrayBuffer();
    const dataView = new DataView(buffer);
    const map: Record<string, string> = {};
    const plainMap: Record<string, string> = {};
    let offset = 0;

    while (offset < buffer.byteLength) {
      // Read the length of the first string
      const _secondLength = dataView.getUint32(offset, true);
      offset += 4;

      // Read the first string
      const _secondString = new TextDecoder("utf-8").decode(new Uint8Array(buffer, offset, _secondLength));
      offset += _secondLength;

      // Read the length of the second string
      const thirdLength = dataView.getUint32(offset, true);
      offset += 4;

      // Read the second string
      const thirdString = new TextDecoder("utf-8").decode(new Uint8Array(buffer, offset, thirdLength));
      offset += thirdLength;

      map[_secondString] = thirdString;
      const keyPlain = plainizeText(_secondString);
      if (keyPlain.length > 0) {
        plainMap[keyPlain] = thirdString;
      }
    }
    window.translationPlainMap = plainMap; // Normalized lookup by whitespace-insensitive key
    // const arr: string[] = []
    // window.ScreenplayContext.blocks.forEach(block => {
    //   block.instructions.forEach(instruction => {
    //     if (instruction.type !== "PlayDialog") return; // Only translate dialog for now
    //     if (instruction.stringParams) {
    //       const raw = resolveStrings(instruction, window.ScreenplayContext.textPool);
    //       let [name, content, mode] = internalExtractDialogData(raw[0]);
    //       const translated = $translate(content);
    //       if (translated === content) {
    //         arr.push(content);
    //         return;
    //       }
    //     }
    //   });
    // });
    // console.log(JSON.stringify(arr));
    // console.log(arr.length)

    return map;
  } catch (err) {
    console.error("Error loading or parsing binary file:", err);
  }
}

export function $translate(key: string) {
  return window.translationPlainMap?.[plainizeText(key)] || key;
}
