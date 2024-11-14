import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Confetti from 'react-confetti';
import './App.css';

const ItemType = 'WORD';

const shuffleArray = (array) => {
  const shuffled = array.slice(); // Copy the array to avoid modifying the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function DraggableWord({ word, fromLine, wordIndex, moveWord }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType,
    item: { word, fromLine, wordIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: ItemType,
    hover: (draggedItem) => {
      if (draggedItem.wordIndex !== wordIndex && draggedItem.fromLine === fromLine) {
        // Only call moveWord if it’s defined
        if (moveWord) {
          moveWord(draggedItem.wordIndex, wordIndex);
          draggedItem.wordIndex = wordIndex; // Update the dragged item's index
        }
      }
    },
  });

  return (
    <div
      ref={(node) => dragRef(dropRef(node))}
      className="story-word"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {word}
    </div>
  );
}


function DroppableLine({ lineIndex, words, onDropWord, onRemoveWord, onCheckLine, onResetLine }) {
  const [{ isOver }, dropRef] = useDrop({
    accept: ItemType,
    drop: (item) => {
      if (item.fromLine !== lineIndex) {
        // Adding a new word from the storyBox or another line
        const updatedWords = [...words, item.word];
        onDropWord(updatedWords, lineIndex); // Update the line with the new word
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const moveWord = (fromIndex, toIndex) => {
    const updatedWords = [...words];
    const [movedWord] = updatedWords.splice(fromIndex, 1);
    updatedWords.splice(toIndex, 0, movedWord);
    onDropWord(updatedWords, lineIndex); // Updates storyLines after reordering
  };

  return (
    <div className="line-drop-container">
      <div ref={dropRef} className="line" style={{ backgroundColor: isOver ? '#e0e0e0' : '#f9f9f9' }}>
        {words.map((word, index) => (
          <DraggableWord
            key={`${word}-${index}`}
            word={word}
            fromLine={lineIndex}
            wordIndex={index}
            moveWord={moveWord} // Consistently pass moveWord
          />
        ))}
        {words.length === 0 && <span className="empty-line">Drop here</span>}
      </div>
      <div className="button-group">
        <button className="check-button" onClick={() => onCheckLine(lineIndex)}>Check</button>
        <button className="reset-line-button" onClick={() => onResetLine(lineIndex)}>Reset</button>
      </div>
    </div>
  );
}




function App() {
  const correctStory = useMemo(() => [["วันนี้", "เป็น", "วัน", "เทศกาล", "ลพบุรี", "แม่", "ของ", "ณิชา", "ชวน", "เขา", "ไป", "ซื้อ", "ผลไม้"], 
  ["ตลาด", "อยู่", "ใกล้", "บ้าน", "คุณ", "ณิชา", "เดิน", "เพียง", "สิบห้า", "นาที"],
  ["ขณะ", "กำลัง", "จะไป", "ตลาด", "ณิชา", "ได้", "เห็น", "ลิง", "ตัว", "หนึ่ง"],
  ["ลิง", "พูด", "สวัสดี", "คุณ", "ชื่อ", "อะไร", "ครับ"],
  ["ณิชา", "ถาม", "โอ้โห", "คุณพูดได้เหรอ", "ณิชา", "ถาม", "ค่ะ"],
  ["ลิง", "พูด", "ได้", "ผม", "พูด", "ได้", "คุณ", "มา", "ทำ", "อะไร", "แถว", "นี้", "ครับ"],
  ["ณิชา", "บอกว่า", "ฉัน", "กำลัง", "ซื้อ", "ผลไม้", "สำหรับ", "เทศกาล", "ลพบุรี", "คุณ", "จะ", "ร่วม", "ด้วย", "ไหม", "ค่ะ"],
  ["ลิง", "พูดว่า", "ได้", "ครับ", "คุณ", "ซื้อ", "ผลไม้", "โปรด", "ที่สุด", "ของ", "ผม", "ให้", "ผม", "หน่อย", "ได้", "ไหม"],
  ["ณิชา", "บอก", "ว่า", "ได้", "ค่ะ"],
  ["ซื้อ", "ผลไม้", "แล้ว", "ณิชา", "กับ", "เพื่อน", "ลิง", "กลับ", "บ้าน", "ด้วย"],
  ["ณิชา", "บอกว่า", "เรา", "มา", "ฉลอง", "ด้วย", "กัน", "เพราะ", "วันนี้", "คือวันพิเศษ", "ของ", "คุณ"],
  ["ลิง", "บอกว่า", "เพราะ", "คุณ", "ใจดี", "กับ", "ผม", "มาก", "ผม", "จะ", "อวยพร", "ให้", "คุณ", "โชคดี", "และ", "ให้", "แน่ใจว่า", "ความ", "ปรารถนา", "ของ", "คุณ", "จะ", "เป็น", "จริง"]], []);
  const [storyBox, setStoryBox] = useState([]);
  const [storyLines, setStoryLines] = useState(() => Array(correctStory.length).fill([]));
  const [lineStatus, setLineStatus] = useState(Array(correctStory.length).fill(false));
  const [showConfetti, setShowConfetti] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    setStoryBox(correctStory.map(line => shuffleArray([...line])));
  }, [correctStory]);

  const handleDropWord = (updatedWords, lineIndex) => {
    const newStoryLines = [...storyLines];
    const newStoryBox = [...storyBox];
  
    // Update the target line with the new set of words
    newStoryLines[lineIndex] = updatedWords;
  
    // Remove dropped words from the storyBox if they were originally in the box
    updatedWords.forEach((word) => {
      newStoryBox.forEach((lineWords, boxLineIndex) => {
        const wordIndex = lineWords.indexOf(word);
        if (wordIndex !== -1) {
          newStoryBox[boxLineIndex] = lineWords.filter((_, idx) => idx !== wordIndex);
        }
      });
    });
  
    setStoryLines(newStoryLines);
    setStoryBox(newStoryBox);
  };
  
  

  const handleRemoveWord = (word, lineIndex, wordIndex) => {
    const newStoryLines = storyLines.map((line) => [...line]);
    const [removedWord] = newStoryLines[lineIndex].splice(wordIndex, 1);
    const newStoryBox = [...storyBox];
    newStoryBox[lineIndex].push(removedWord);
    setStoryLines(newStoryLines);
    setStoryBox(newStoryBox);
  };

  const handleCheckLine = (lineIndex) => {
    const isLineCorrect = JSON.stringify(storyLines[lineIndex]) === JSON.stringify(correctStory[lineIndex]);

    if (isLineCorrect) {
      const updatedLineStatus = [...lineStatus];
      updatedLineStatus[lineIndex] = true;
      setLineStatus(updatedLineStatus);

      setPopupMessage(`Line ${lineIndex + 1} is correct!`);
      setShowPopup(true);

      if (updatedLineStatus.every(status => status)) {
        setShowConfetti(true);
        setPopupMessage("Congratulations! All lines are correct!");
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } else {
      setPopupMessage(`Sentence ${lineIndex + 1} is incorrect. Try again!`);
      setShowPopup(true);
    }
  };

  const handleResetLine = (lineIndex) => {
    const newStoryLines = [...storyLines];
    const wordsToReset = newStoryLines[lineIndex];
    const newStoryBox = [...storyBox];
  
    // Reset the words to their original shuffled position in the storyBox line
    newStoryBox[lineIndex] = [...newStoryBox[lineIndex], ...wordsToReset];
  
    // Clear the current line
    newStoryLines[lineIndex] = [];
  
    setStoryBox(newStoryBox);
    setStoryLines(newStoryLines);
  };
  
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <h1>Rearrange each line of the story</h1>
        
        {showConfetti && <Confetti />}

        <div className="story-lines-container">
          {storyBox.map((lineWords, lineIndex) => (
            <div className="line-group" key={lineIndex}>
              <div className="story-box">
                {lineWords.map((word, wordIndex) => (
                  <DraggableWord
                    key={`${word}-${wordIndex}`}
                    word={word}
                    fromLine="box"
                    wordIndex={wordIndex}
                    onRemove={() => {}}
                  />
                ))}
              </div>
              <DroppableLine
                lineIndex={lineIndex}
                words={storyLines[lineIndex]}
                onDropWord={handleDropWord}
                onRemoveWord={handleRemoveWord}
                onCheckLine={handleCheckLine}
                onResetLine={handleResetLine}
              />
            </div>
          ))}
        </div>

        {showPopup && (
          <div className="popup">
            <button className="close-button" onClick={() => setShowPopup(false)}>×</button>
            {popupMessage}
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default App;