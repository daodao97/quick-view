export function replaceSpaces(input: string) {
    let result = [];
    let outside = true; // 标记当前是否在引号外部
    let current = ""; // 当前处理的字符串段

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        // 检测引号，切换状态
        if (char === '"' || char === "'") {
            // 如果是引号开头，先处理之前的文本
            if (outside) {
                result.push(current.replace(/\s+/g, ' '));
                current = char;
            } else {
                // 如果是引号结尾，将引号内文本加入结果
                current += char;
                result.push(current);
                current = "";
            }
            outside = !outside;
        } else {
            current += char;
        }
    }

    // 添加最后一段内容
    if (outside) {
        result.push(current.replace(/\s+/g, ' '));
    } else {
        result.push(current);
    }

    return result.join("");
}

export function decodeUnicode(str: string) {
    // 使用 JSON.parse 解析类似 JSON 字符串的结构
    return JSON.parse('"' + str + '"');
  }