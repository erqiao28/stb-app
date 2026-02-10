// <free_field_name>文本颜色处理</free_field_name>
// <file_name>ColoredText_v1.jsx</file_name>
function ColoredText(props) {
  var formData = props.formData || {};
  
  // 获取字段6937d219ff2b019b3cb34bc6的值
  var targetControlId = '6937d219ff2b019b3cb34bc6';
  var text = formData[targetControlId] && formData[targetControlId].value ? formData[targetControlId].value : '';

  // 如果文本为空，直接返回
  if (!text) {
    return text;
  }

  // 从全局获取 React
  var ReactObj = typeof React !== 'undefined' ? React : (typeof window !== 'undefined' && window.React ? window.React : null);
  
  if (!ReactObj || !ReactObj.createElement) {
    // 如果 React 不可用，直接返回原文本
    return text;
  }

  // 构建需要改变颜色的区间数组
  var coloredRanges = [];

  // 找到所有冒号的位置（支持中文：和英文:）
  var allColonIndices = [];
  var searchIndex = 0;
  while (searchIndex < text.length) {
    var colonIndex1 = text.indexOf(':', searchIndex);
    var colonIndex2 = text.indexOf('：', searchIndex);
    var nextColon = -1;
    
    if (colonIndex1 !== -1 && colonIndex2 !== -1) {
      nextColon = Math.min(colonIndex1, colonIndex2);
    } else if (colonIndex1 !== -1) {
      nextColon = colonIndex1;
    } else if (colonIndex2 !== -1) {
      nextColon = colonIndex2;
    }
    
    if (nextColon === -1) {
      break;
    }
    
    allColonIndices.push(nextColon);
    searchIndex = nextColon + 1;
  }

  // 对每个冒号，找到它后面的第一个分号，将冒号后到分号前的文本标记为红色
  for (var c = 0; c < allColonIndices.length; c++) {
    var colonPos = allColonIndices[c];
    var searchStart = colonPos + 1;
    
    // 找到冒号后第一个分号的位置（支持中文；和英文;）
    var semicolonAfterColon1 = text.indexOf(';', searchStart);
    var semicolonAfterColon2 = text.indexOf('；', searchStart);
    var semicolonAfterColon = -1;
    
    if (semicolonAfterColon1 !== -1 && semicolonAfterColon2 !== -1) {
      semicolonAfterColon = Math.min(semicolonAfterColon1, semicolonAfterColon2);
    } else if (semicolonAfterColon1 !== -1) {
      semicolonAfterColon = semicolonAfterColon1;
    } else if (semicolonAfterColon2 !== -1) {
      semicolonAfterColon = semicolonAfterColon2;
    }
    
    // 如果找到了分号，且中间有文本，则添加到红色区间
    if (semicolonAfterColon !== -1 && semicolonAfterColon > colonPos + 1) {
      coloredRanges.push({ start: colonPos + 1, end: semicolonAfterColon });
    }
  }

  // 如果没有需要改变颜色的部分，直接返回原文本
  if (coloredRanges.length === 0) {
    return text;
  }

  // 合并重叠的区间
  coloredRanges.sort(function(a, b) { return a.start - b.start; });
  var mergedRanges = [];
  for (var i = 0; i < coloredRanges.length; i++) {
    if (mergedRanges.length === 0 || mergedRanges[mergedRanges.length - 1].end < coloredRanges[i].start) {
      mergedRanges.push({ start: coloredRanges[i].start, end: coloredRanges[i].end });
    } else {
      mergedRanges[mergedRanges.length - 1].end = Math.max(
        mergedRanges[mergedRanges.length - 1].end,
        coloredRanges[i].end
      );
    }
  }

  // 将文本分割成普通文本和需要改变颜色的文本片段
  var parts = [];
  var lastIndex = 0;

  for (var j = 0; j < mergedRanges.length; j++) {
    var range = mergedRanges[j];
    // 确保区间有效
    if (range.start < 0 || range.end > text.length || range.start >= range.end) {
      continue;
    }
    
    // 添加区间前的普通文本
    if (range.start > lastIndex) {
      var beforeText = text.substring(lastIndex, range.start);
      if (beforeText.length > 0) {
        parts.push({
          text: beforeText,
          colored: false
        });
      }
    }
    
    // 添加需要改变颜色的文本
    var coloredText = text.substring(range.start, range.end);
    if (coloredText.length > 0) {
      parts.push({
        text: coloredText,
        colored: true
      });
    }
    
    lastIndex = range.end;
  }

  // 添加最后剩余的普通文本
  if (lastIndex < text.length) {
    var remainingText = text.substring(lastIndex);
    if (remainingText.length > 0) {
      parts.push({
        text: remainingText,
        colored: false
      });
    }
  }

  // 创建React元素数组
  var children = [];
  for (var k = 0; k < parts.length; k++) {
    var part = parts[k];
    if (part.colored) {
      // 需要改变颜色的文本：红色
      children.push(
        ReactObj.createElement('span', {
          key: 'colored-' + k,
          style: {
            color: 'red'
          }
        }, part.text)
      );
    } else {
      // 普通文本
      children.push(
        ReactObj.createElement('span', {
          key: 'normal-' + k
        }, part.text)
      );
    }
  }

  // 返回包含所有子元素的div
  return ReactObj.createElement('div', {
    style: {
      display: 'inline-block',
      width: '100%'
    }
  }, children);
}
