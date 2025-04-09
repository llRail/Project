import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import './App.css';
import Points from './Points';

function App() {
  // State variables
  const [quizQuestions, setQuizQuestions] = useState([]);  // Renamed 'questions' to 'quizQuestions'
  const [responseHistory, setResponseHistory] = useState([]);  // Renamed 'answerHistory' to 'responseHistory'
  const [userScore, setUserScore] = useState(0);  // Renamed 'score' to 'userScore'
  const [currentQuestion, setCurrentQuestion] = useState(0);  // Renamed 'currentQuestionIndex' to 'currentQuestion'
  const [quizCompleted, setQuizCompleted] = useState(false);  // Renamed 'quizFinished' to 'quizCompleted'
  const [userInfo, setUserInfo] = useState({ username: "User", points: 0 });  // Renamed 'user' to 'userInfo'
  const [learningMaterials, setLearningMaterials] = useState([]);  // Renamed 'studyMaterials' to 'learningMaterials'
  const [selectedLearningMaterial, setSelectedLearningMaterial] = useState(null);  // Renamed 'selectedMaterial' to 'selectedLearningMaterial'
  const [remainingTime, setRemainingTime] = useState(10);  // Renamed 'timeLeft' to 'remainingTime'
  const [activePage, setActivePage] = useState('home');  // Renamed 'activeScreen' to 'activePage'
  const [paused, setPaused] = useState(false);  // Renamed 'isPaused' to 'paused'
  const [performanceMetrics, setPerformanceMetrics] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0
  });  // Renamed 'performanceData' to 'performanceMetrics'

  const timerRef = useRef(null);

  // Fetch quiz questions and user data
  useEffect(() => {
    axios.get("http://localhost:5000/questions")
      .then((res) => setQuizQuestions(res.data))
      .catch((err) => console.error("Error fetching quiz questions:", err));

    axios.get("http://localhost:5000/get-user?username=User")
      .then((res) => setUserInfo(res.data))
      .catch((err) => console.error("Error fetching user data:", err));
  }, []);

  // Fetch learning materials based on user points
  useEffect(() => {
    axios.get(`http://localhost:5000/study-materials?points=${userInfo.points}`)
      .then((res) => setLearningMaterials(res.data))
      .catch((err) => console.error("Error fetching learning materials:", err));
  }, [userInfo.points]);

  // Timer countdown logic
  useEffect(() => {
    if (!quizCompleted && !paused) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime === 1) {
            nextQuizQuestion();
            return 10;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);  // Cleanup on component unmount
  }, [currentQuestion, quizCompleted, paused]);

  // Check if the answer is correct and update performance
  const checkAnswer = (selectedOption, correctAnswer, questionType) => {
    let updatedPoints = userInfo.points;
    let updatedPerformance = { ...performanceMetrics };
    const isAnswerCorrect = questionType === "Image-Based" ? selectedOption === correctAnswer : selectedOption === correctAnswer;

    if (isAnswerCorrect) {
      updatedPerformance.correctAnswers += 1;
      updatedPoints += 10;
      setUserScore(userScore + 10);
    } else {
      updatedPerformance.incorrectAnswers += 1;
    }

    setResponseHistory([...responseHistory, isAnswerCorrect ? "correct" : "incorrect"]);
    setPerformanceMetrics(updatedPerformance);

    // Update user points
    axios.post("http://localhost:5000/update-points", {
      username: userInfo.username,
      points: updatedPoints
    })
      .then((res) => setUserInfo(res.data))
      .catch((err) => console.error("Error updating user points:", err));

    nextQuizQuestion();
  };

  // Move to the next quiz question with difficulty adjustments
  const nextQuizQuestion = () => {
    let nextQuestionIndex = currentQuestion + 1;

    if (performanceMetrics.correctAnswers > 2) {
      setPerformanceMetrics({ correctAnswers: 0, incorrectAnswers: 0 });
      const harderQuestion = quizQuestions.find(q => q.difficulty === "hard");
      if (harderQuestion) nextQuestionIndex = quizQuestions.indexOf(harderQuestion);
    } else if (performanceMetrics.incorrectAnswers > 2) {
      setPerformanceMetrics({ correctAnswers: 0, incorrectAnswers: 0 });
      const easierQuestion = quizQuestions.find(q => q.difficulty === "easy");
      if (easierQuestion) nextQuestionIndex = quizQuestions.indexOf(easierQuestion);
    } else {
      const mediumQuestion = quizQuestions.find(q => q.difficulty === "medium");
      if (mediumQuestion) nextQuestionIndex = quizQuestions.indexOf(mediumQuestion);
    }

    if (nextQuestionIndex < quizQuestions.length) {
      setCurrentQuestion(nextQuestionIndex);
      setRemainingTime(10);
    } else {
      setQuizCompleted(true);
    }
  };

  // Reset quiz for retry
  const retryQuiz = () => {
    axios.post("http://localhost:5000/reset-points", { username: userInfo.username })
      .then(() => {
        setUserInfo(prev => ({ ...prev, points: 0 }));
        setUserScore(0);
        setCurrentQuestion(0);
        setQuizCompleted(false);
        setRemainingTime(10);
        setPerformanceMetrics({ correctAnswers: 0, incorrectAnswers: 0 });
      })
      .catch((err) => console.error("Error resetting points:", err));
    setResponseHistory([]);
  };

  // Handle learning material click
  const handleMaterialClick = (material) => {
    setSelectedLearningMaterial(material);
  };

  // Change the active page (screen)
  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === 'home') {
      setPaused(false);
    } else {
      setPaused(true);
    }
  };

  return (
    <div className="app-layout">
      <div className="sidebar">
        <button onClick={() => handlePageChange('home')}>Home</button>
        <button onClick={() => handlePageChange('points')}>Points</button>
        <button onClick={() => handlePageChange('learn')}>Learn</button>
      </div>

      <div className="content">
        {activePage === 'home' && (
          <div>
            <h1>Cybersecurity Quiz</h1>
            <header className="points-header">Points: {userInfo.points}</header>
            <div><h3>Welcome, {userInfo.username}!</h3></div>

            {!quizCompleted ? (
              <div className="quiz-container">
                <p><b>Q{currentQuestion + 1}:</b> {quizQuestions[currentQuestion]?.question_text}</p>
                <h3>Time Left: {remainingTime}s</h3>

                {quizQuestions[currentQuestion]?.type === "Image-Based" && (
                  <img src={quizQuestions[currentQuestion].image_url} alt="Question Image" />
                )}

                <div className="progress-bar-container">
                  {quizQuestions.map((q, index) => (
                    <div
                      key={index}
                      className={`progress-segment ${
                        index < responseHistory.length
                          ? responseHistory[index] === "correct"
                            ? "correct"
                            : "incorrect"
                          : ""
                      }`}
                    ></div>
                  ))}
                </div>

                {quizQuestions[currentQuestion]?.options.map((option, index) => (
                  <button
                    className="answer-button"
                    key={index}
                    onClick={() => checkAnswer(option, quizQuestions[currentQuestion]?.correct_answer, quizQuestions[currentQuestion]?.type)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <h2>Quiz Completed</h2>
                <p>Your final score is: {userScore}</p>
                <button className="retry-button" onClick={retryQuiz}>Retry Quiz</button>
                <button className="review-button" onClick={() => handlePageChange('review')}>Review Results</button>
              </div>
            )}
          </div>
        )}

        {activePage === 'review' && (
          <div>
            <h1>Quiz Review</h1>
            <ul>
              {quizQuestions.map((q, index) => (
                <li key={index}>
                  <p><b>{q.question_text}</b></p>
                  <p>Your Answer: {responseHistory[index]}</p>
                  <p>Correct Answer: {q.correct_answer}</p>
                </li>
              ))}
            </ul>
            <button onClick={() => handlePageChange('home')}>Back to Home</button>
          </div>
        )}

        {activePage === 'points' && (
          <Points user={userInfo} onBackToHome={() => handlePageChange('home')} />
        )}

        {activePage === 'learn' && (
          <div>
            <h1>Learn More</h1>
            <div>
              <h2>Learning Materials</h2>
              {learningMaterials.length > 0 ? (
                <div>
                  {learningMaterials.map((material, index) => (
                    <div className="study-material" key={index}>
                      <h3>{material.title}</h3>
                      <p>{material.content}</p>
                      <button onClick={() => handleMaterialClick(material)}>Read More</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>You need more points to unlock learning materials.</p>
              )}
            </div>
            {selectedLearningMaterial && (
              <div className="study-material">
                <h3>{selectedLearningMaterial.title}</h3>
                <p>{selectedLearningMaterial.content}</p>
                <p><b>Full Description:</b> {selectedLearningMaterial.description}</p>
                <p><b>Key Takeaways:</b> {selectedLearningMaterial.keyTakeaways}</p>
                <a href={selectedLearningMaterial.link} target="_blank" rel="noopener noreferrer">Read Full Material</a>
              </div>
            )}
            <button onClick={() => handlePageChange('home')}>Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
