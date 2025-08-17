// js/questions.js

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateQuestion(difficulty) {
    let q = {};
    // p1: Grade 1
    if (difficulty === 'p1') {
        const type = randInt(1, 4);
        if (type === 1) { let n1 = randInt(1, 8); let n2 = randInt(1, 9 - n1); q = { text: `${n1} + ${n2} = ?`, answer: n1 + n2 };
        } else if (type === 2) { let n1 = randInt(2, 9); let n2 = randInt(1, n1 - 1); q = { text: `${n1} - ${n2} = ?`, answer: n1 - n2 };
        } else if (type === 3) { let n1 = randInt(1, 19); let n2 = randInt(1, 20 - n1); q = { text: `${n1} + ${n2} = ?`, answer: n1 + n2 };
        } else { let n1 = randInt(10, 20); let n2 = randInt(1, n1 - 1); q = { text: `${n1} - ${n2} = ?`, answer: n1 - n2 }; }
    }
    // p2: Grade 2
    else if (difficulty === 'p2') {
        const type = randInt(1, 4);
        if (type === 1) { let n1 = randInt(20, 99); let n2 = randInt(10, n1 - 10); if (Math.random() > 0.5) q = { text: `${n1} + ${n2} = ?`, answer: n1 + n2 }; else q = { text: `${n1} - ${n2} = ?`, answer: n1 - n2 };
        } else if (type === 2) { let n1 = randInt(100, 999); let n2 = randInt(50, n1 - 50); if (Math.random() > 0.5) q = { text: `${n1} + ${n2} = ?`, answer: n1 + n2 }; else q = { text: `${n1} - ${n2} = ?`, answer: n1 - n2 };
        } else if (type === 3) { let n1 = randInt(2, 6); let n2 = randInt(2, 12); q = { text: `${n1} × ${n2} = ?`, answer: n1 * n2 };
        } else { let n1 = randInt(10, 20); let n2 = randInt(2, 5); let n3 = randInt(1, 5); q = { text: `(${n1} + ${n2}) - ${n3} = ?`, answer: (n1 + n2) - n3 }; }
    }
    // p3: Grade 3
    else if (difficulty === 'p3') {
        const type = randInt(1, 4);
        if (type === 1) { let n1 = randInt(1000, 99999); let n2 = randInt(100, n1 - 100); if (Math.random() > 0.5) q = { text: `${n1.toLocaleString()} + ${n2.toLocaleString()} = ?`, answer: n1 + n2 }; else q = { text: `${n1.toLocaleString()} - ${n2.toLocaleString()} = ?`, answer: n1 - n2 };
        } else if (type === 2) { let n1 = randInt(2, 12); let n2 = randInt(2, 12); q = { text: `${n1} × ${n2} = ?`, answer: n1 * n2 };
        } else if (type === 3) { let n2 = randInt(2, 12); let ans = randInt(2, 12); let n1 = n2 * ans; q = { text: `${n1} ÷ ${n2} = ?`, answer: ans };
        } else { let n1 = randInt(5, 12); let n2 = randInt(2, 10); let n3 = randInt(2, 5); q = { text: `(${n1} × ${n2}) + ${n3} = ?`, answer: (n1 * n2) + n3 }; }
    }
    // p4: Grade 4
    else if (difficulty === 'p4') {
        if (Math.random() > 0.6) {
            const type = randChoice(['money', 'items']);
            if (type === 'money') {
                let total = randInt(500, 1000);
                let i1_q = randInt(3, 5); let i1_p = randInt(20, 50);
                let i2_q = randInt(2, 6); let i2_p = randInt(5, 15);
                q = { text: `สมชายมีเงิน ${total} บาท ซื้อสมุด ${i1_q} เล่ม เล่มละ ${i1_p} บาท และดินสอ ${i2_q} แท่ง แท่งละ ${i2_p} บาท สมชายจะเหลือเงินกี่บาท?`, answer: total - (i1_q * i1_p) - (i2_q * i2_p) };
            } else {
                let n2 = randInt(5, 15); let cost = n2 * 12; let n1 = randInt(cost + 10, 500); q = { text: `แม่ค้ามีมะม่วง ${n1} ผล ขายไป ${n2} เข่ง เข่งละ 12 ผล จะเหลือมะม่วงกี่ผล?`, answer: n1 - cost };
            }
        } else { const type = randInt(1, 3); if (type === 1) { let n1 = randInt(10, 99); let n2 = randInt(10, 99); q = { text: `${n1} × ${n2} = ?`, answer: n1 * n2 }; } else if (type === 2) { let n1 = randInt(100, 500); let n2 = randInt(3, 15); q = { text: `${n1} ÷ ${n2} เหลือเศษเท่าไร?`, answer: n1 % n2 }; } else { let n1 = randInt(100, 200); let n2 = randInt(5, 10); let n3 = randInt(20, 50); q = { text: `(${n1} ÷ ${n2}) + ${n3} = ? (ตอบเป็นจำนวนเต็ม)`, answer: Math.floor(n1 / n2) + n3 }; } }
    }
    // p5: Grade 5
    else if (difficulty === 'p5') {
         if (Math.random() > 0.6) {
              const type = randChoice(['area', 'average']);
              if (type === 'area') {
                  let w = randInt(5, 20); let h = randInt(10, 30); q = { text: `ห้องสี่เหลี่ยมผืนผ้ากว้าง ${w} เมตร ยาว ${h} เมตร มีพื้นที่เท่าไร (ตารางเมตร)?`, answer: w * h };
              } else {
                  let s1 = randInt(30, 50); let s2 = randInt(30, 50); let s3 = randInt(30, 50);
                  q = { text: `นักเรียน 3 คน มีน้ำหนัก ${s1}, ${s2}, ${s3} กิโลกรัม น้ำหนักเฉลี่ยของนักเรียนกลุ่มนี้คือเท่าไร? (ตอบเป็นจำนวนเต็ม)`, answer: Math.round((s1+s2+s3)/3) };
              }
         } else { const type = randInt(1, 3); if (type === 1) { let d = randInt(5, 10); let n1 = randInt(1, d-1); let n2 = randInt(1, d-1); q = { text: `${n1}/${d} + ${n2}/${d} = ? (ตอบเป็นทศนิยม 2 ตำแหน่ง)`, answer: parseFloat(((n1 + n2) / d).toFixed(2)) }; } else if (type === 2) { let n1 = (randInt(1, 99) / 10); let n2 = randInt(2, 9); q = { text: `${n1} × ${n2} = ?`, answer: parseFloat((n1 * n2).toFixed(2)) }; } else { let b = randInt(10, 20) * 2; let h = randInt(5, 15); q = { text: `สามเหลี่ยมมีฐาน ${b} ซม. สูง ${h} ซม. มีพื้นที่เท่าไร (ตร.ซม.)?`, answer: 0.5 * b * h }; } }
    }
    // p6: Grade 6
    else if (difficulty === 'p6') {
         if (Math.random() > 0.6) {
              const type = randChoice(['discount', 'speed']);
              if (type === 'discount') {
                  let price = randInt(100, 500) * 10; let discount = randInt(10, 30); q = { text: `สินค้าราคา ${price} บาท ลดราคา ${discount}% จะเหลือราคากี่บาท?`, answer: Math.round(price * (1 - discount/100)) };
              } else {
                  let speed = randChoice([60, 80, 100]); let time = randInt(2, 5);
                  q = { text: `รถยนต์วิ่งด้วยความเร็ว ${speed} กิโลเมตรต่อชั่วโมง เป็นเวลา ${time} ชั่วโมง จะได้ระยะทางเท่าไร (กิโลเมตร)?`, answer: speed * time };
              }
         } else { const type = randInt(1, 3); if (type === 1) { let n1 = randInt(2, 10); let d1 = randInt(2, 10); let n2 = randInt(2, 10); let d2 = randInt(2, 10); q = { text: `(${n1}/${d1}) ÷ (${n2}/${d2}) = ? (ตอบเป็นทศนิยม 2 ตำแหน่ง)`, answer: parseFloat(((n1/d1) / (n2/d2)).toFixed(2)) }; } else if (type === 2) { let n1 = randInt(20, 100); let n2 = randInt(2, 10); q = { text: `${n1} ÷ ${n2} = ?`, answer: n1 / n2 }; } else { let r = randInt(5, 10); q = { text: `วงกลมมีรัศมี ${r} หน่วย มีพื้นที่เท่าไร? (ใช้ π ≈ 3.14)`, answer: parseFloat((3.14 * r * r).toFixed(2)) }; } }
    }
    // m1: Grade 7
    else if (difficulty === 'm1') {
        const type = randInt(1, 5);
        if (type === 1) { let n1 = randInt(-20, 20); let n2 = randInt(-20, 20); q = { text: `(${n1}) + (${n2}) = ?`, answer: n1 + n2 };
        } else if (type === 2) { let n1 = randInt(2, 5); let n2 = randInt(2, 3); q = { text: `${n1}^${n2} = ?`, answer: Math.pow(n1, n2) };
        } else if (type === 3) { let a = randInt(2, 5); let x = randInt(2, 10); let b = randInt(1, 10); let c = a * x + b; q = { text: `ถ้า ${a}x + ${b} = ${c}, จงหาค่า x`, answer: x };
        } else if (type === 4) { let n = randInt(-50, 50); q = { text: `|${n}| = ?`, answer: Math.abs(n) };
        } else { let x = randInt(5, 20); let a = randInt(2, 5); let b = randInt(10, 50); let result = a * x + b; q = { text: `${a} เท่าของจำนวนหนึ่งบวกกับ ${b} ได้ผลลัพธ์เป็น ${result} จงหาจำนวนนั้น`, answer: x }; }
    }
    // m2: Grade 8
    else if (difficulty === 'm2') {
        const type = randInt(1, 4);
        if (type === 1) { const triplets = [[3,4,5], [5,12,13], [8,15,17], [7,24,25]]; const t = randChoice(triplets); const mult = randInt(1, 3); const a = t[0]*mult; const b = t[1]*mult; const c = t[2]*mult; q = { text: `บันไดยาว ${c} เมตร วางพาดกับกำแพงโดยโคนบันไดอยู่ห่างจากกำแพง ${a} เมตร ปลายบันไดจะอยู่สูงจากพื้นกี่เมตร?`, answer: b };
        } else if (type === 2) { let n = randInt(4, 15); q = { text: `√${n*n} = ?`, answer: n };
        } else if (type === 3) { let a = randInt(2, 7); let b = randInt(2, 7); q = { text: `x² + ${a+b}x + ${a*b} = (x+a)(x+b). จงหาค่า a+b`, answer: a+b };
        } else { let a = randInt(2, 5); let b = randInt(2, 5); q = { text: `(x + ${a})(x + ${b}) = x² + ?x + ${a*b}. จงหาค่าที่หายไป`, answer: a+b }; }
    }
    // m3: Grade 9
    else if (difficulty === 'm3') {
        const type = randInt(1, 4);
        if (type === 1) { let a = randInt(2, 5); let b = randInt(1, 10); let c = randInt(20, 50); q = { text: `จากอสมการ ${a}x + ${b} > ${c}, ค่า x ที่น้อยที่สุดที่เป็นจำนวนเต็มคือเท่าไร?`, answer: Math.floor((c - b) / a) + 1 };
        } else if (type === 2) { let x = randInt(1, 5); let y = randInt(1, 5); let c1 = x + y; let c2 = x - y; q = { text: `ถ้า x + y = ${c1} และ x - y = ${c2}, จงหาค่า x`, answer: x };
        } else if (type === 3) { const angle = randChoice([30, 45, 60]); if (angle === 30) q = { text: `sin(30°) มีค่าเท่าไร? (ตอบเป็นทศนิยม)`, answer: 0.5 }; if (angle === 45) q = { text: `cos(45°) มีค่าเท่าไร? (ตอบเป็นทศนิยม 2 ตำแหน่ง)`, answer: 0.71 }; if (angle === 60) q = { text: `tan(60°) มีค่าเท่าไร? (ตอบเป็นทศนิยม 2 ตำแหน่ง)`, answer: 1.73 };
        } else { let h = randInt(-5, 5); q = { text: `จากสมการ y = (x - ${h})² + 2, จุดยอดของพาราโบลาคือ (h, k). จงหาค่า h`, answer: h }; }
    }

    if (!q.text) { q = { text: `1 + 1 = ?`, answer: 2 }; }
    return q;
}