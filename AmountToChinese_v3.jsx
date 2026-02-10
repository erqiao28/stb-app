// <free_field_name>金额转大写</free_field_name>
// <file_name>AmountToChinese_v3.jsx</file_name>

function AmountToChinese(props) {
  var formData = props.formData || {};
  
  // 定义目标字段的 controlId
  var targetControlId = "673d86b6c238548ea466a91e";
  var amount = formData[targetControlId] && formData[targetControlId].value ? formData[targetControlId].value : '';

  // 将数值金额转换为大写金额
  function toChineseUpperCase(num) {
    // 如果输入为空或无效，返回空字符串
    if (!num || num === '' || num === null || num === undefined) {
      return '';
    }

    // 转换为字符串并去除首尾空格
    var numStr = String(num).trim();
    
    // 如果为空字符串，返回空
    if (numStr === '') {
      return '';
    }

    // 验证是否为有效数字（支持小数）
    var validNumRegex = /^-?\d+(\.\d+)?$/;
    if (!validNumRegex.test(numStr)) {
      return '';
    }

    // 如果是负数，先处理正数部分，最后加上"负"
    var isNegative = numStr.indexOf('-') === 0;
    var absNumStr = isNegative ? numStr.substring(1) : numStr;

    var chnNumChar = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
    var chnUnitSection = ["", "万", "亿", "万亿", "亿亿"];
    var chnUnitChar = ["", "拾", "佰", "仟"];
    var chnDecimals = ["角", "分"];

    var parts = absNumStr.split('.');
    var integerPart = parts[0];
    var decimalPart = parts[1];
    
    // 处理小数部分
    if (!decimalPart) {
      decimalPart = '00';
    } else if (decimalPart.length === 1) {
      decimalPart += '0';
    } else if (decimalPart.length > 2) {
      // 如果小数部分超过2位，只取前2位
      decimalPart = decimalPart.substring(0, 2);
    }

    // 如果整数部分和小数部分都为0，返回"零元整"
    if (integerPart === '0' && decimalPart === '00') {
      return isNegative ? "负零元整" : "零元整";
    }

    var unitPos = 0;
    var strIns = "";
    var chnStr = "";
    var needZero = false;

    // 处理整数部分
    if (integerPart !== '0') {
      while (integerPart.length > 0) {
        var section = integerPart.substr(integerPart.length - 4, 4);
        integerPart = integerPart.substr(0, integerPart.length - 4);

        var sectionStr = "";
        var hasValue = false; // 标记这一节是否有非零值
        
        for (var i = 0; i < section.length; i++) {
          var n = parseInt(section[i]);
          if (n === 0) {
            if (needZero && hasValue) {
              sectionStr = sectionStr + chnNumChar[n];
              needZero = false;
            }
          } else {
            hasValue = true;
            needZero = false;
            sectionStr = sectionStr + chnNumChar[n] + chnUnitChar[section.length - i - 1];
          }
        }

        if (sectionStr !== "") {
          strIns = sectionStr + chnUnitSection[unitPos] + strIns;
          needZero = true; // 下一节如果需要补零
        } else if (unitPos > 0 && strIns !== "") {
          // 如果这一节全为0，但前面有值，标记需要补零
          needZero = true;
        }

        unitPos++;
      }

      chnStr = strIns + "元";
    } else {
      // 整数部分为0
      chnStr = "";
    }

    // 处理小数部分
    if (decimalPart !== '00') {
      // 如果整数部分为0，需要加上"零元"
      if (chnStr === "") {
        chnStr = "零元";
      }
      
      var hasDecimal = false;
      for (var j = 0; j < decimalPart.length; j++) {
        var m = parseInt(decimalPart[j]);
        if (m !== 0) {
          hasDecimal = true;
          chnStr += chnNumChar[m] + chnDecimals[j];
        } else if (hasDecimal && j === 0) {
          // 如果角为0但分不为0，需要补"零"
          chnStr += "零";
        }
      }
    }

    // 如果只有整数部分，添加"整"
    if (decimalPart === '00') {
      chnStr += "整";
    }

    // 如果是负数，在前面加上"负"
    return isNegative ? "负" + chnStr : chnStr;
  }

  // 直接计算转换结果
  var chineseAmount = toChineseUpperCase(amount);

  // 从全局获取 React（假设 React 已全局加载）
  var ReactObj = typeof React !== 'undefined' ? React : (typeof window !== 'undefined' && window.React ? window.React : null);
  
  if (!ReactObj || !ReactObj.createElement) {
    // 如果 React 不可用，返回一个简单的 div
    return null;
  }

  // 使用 React.createElement 创建 React 元素
  return ReactObj.createElement('div', { className: 'flex items-center' },
    ReactObj.createElement('span', { className: 'text-sm text-gray-700 mr-2' }),
    ReactObj.createElement('input', {
      type: 'text',
      readOnly: true,
      value: chineseAmount,
      className: 'w-[600px] h-[36px] px-2 border rounded-md border-gray-300'
    })
  );
}

// 如果需要在全局作用域中使用，可以取消下面的注释
// window.AmountToChinese = AmountToChinese;
