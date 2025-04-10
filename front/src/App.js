import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import './App.css';
import Points from './Points';

function App() {
  
  const [questionsList, setQuestionsList] = useState([]); // list for the quiz questions
  const [userResponses, setUserResponses] = useState([]); 
  const [totalScore, setTotalScore] = useState(0); // user total score
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [isQuizFinished, setIsQuizFinished] = useState(false); // checks if quiz is completed
  const [profileData, setProfileData] = useState({ username: "User", points: 0 }); 
  const [learningResources, setLearningResources] = useState([]); // learning materials based on points system
  const [chosenMaterial, setChosenMaterial] = useState(null); 
  const [countdownTime, setCountdownTime] = useState(10); // Countdown timer for all questions system
  const [activePageView, setActivePageView] = useState('home'); // tracking of user current page
  const [isPaused, setIsPaused] = useState(false); // checks if quiz is paused
  const [performanceData, setPerformanceData] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0
  }); 

  const timerReference = useRef(null); // timer reference

  // Fetch quiz questions on start
  useEffect(() => {
    axios.get("http://localhost:5000/questions")
      .then((response) => {
        
        const filteredQuestions = response.data.filter((_, index) => index !== 6);
        setQuestionsList(filteredQuestions); 
      })
      .catch((error) => console.error("Error fetching quiz questions:", error));

    axios.get("http://localhost:5000/get-user?username=User")
      .then((response) => setProfileData(response.data)) 
      .catch((error) => console.error("Error fetching user data:", error));
  }, []);

  // Fetch learning materials based on the user points
  useEffect(() => {
    axios.get(`http://localhost:5000/study-materials?points=${profileData.points}`)
      .then((response) => setLearningResources(response.data)) 
      .catch((error) => console.error("Error fetching learning materials:", error));
  }, [profileData.points]);

  // Timer countdown system for questions
  useEffect(() => {
    if (!isQuizFinished && !isPaused) {
      timerReference.current = setInterval(() => {
        setCountdownTime(prevTime => {
          if (prevTime === 1) {
            moveToNextQuestion();
            return 10; // Reset timer for the next question system
          }
          return prevTime - 1; // timer decreased by 1 second
        });
      }, 1000);
    }

    return () => clearInterval(timerReference.current);  // 
  }, [currentIndex, isQuizFinished, isPaused]);

  
  const validateAnswer = (selectedChoice, correctChoice, questionType) => {
    let updatedPoints = profileData.points;
    let updatedPerformance = { ...performanceData };
    const isAnswerCorrect = questionType === "Image-Based" ? selectedChoice === correctChoice : selectedChoice === correctChoice;

    if (isAnswerCorrect) {
      updatedPerformance.correctAnswers += 1;
      updatedPoints += 10; // 10 points to user for cright answer
      setTotalScore(totalScore + 10); // Update total score system
    } else {
      updatedPerformance.incorrectAnswers += 1; 
    }

    setUserResponses([...userResponses, isAnswerCorrect ? "correct" : "incorrect"]);
    setPerformanceData(updatedPerformance);

    // this willUpdate the user's points in the backend
    axios.post("http://localhost:5000/update-points", {
      username: profileData.username,
      points: updatedPoints
    })
      .then((response) => setProfileData(response.data)) // Update data with new points of the user
      .catch((error) => console.error("Error updating user points:", error));

    moveToNextQuestion(); // Moves to next question
  };

  // adaptive difficulty system implementation not successful
  const moveToNextQuestion = () => {
    let nextQuestionIndex = currentIndex + 1;

    if (performanceData.correctAnswers > 2) {
      setPerformanceData({ correctAnswers: 0, incorrectAnswers: 0 });
      const harderQuestion = questionsList.find(q => q.difficulty === "hard");
      if (harderQuestion) nextQuestionIndex = questionsList.indexOf(harderQuestion);
    } else if (performanceData.incorrectAnswers > 2) {
      setPerformanceData({ correctAnswers: 0, incorrectAnswers: 0 });
      const easierQuestion = questionsList.find(q => q.difficulty === "easy");
      if (easierQuestion) nextQuestionIndex = questionsList.indexOf(easierQuestion);
    } else {
      const mediumQuestion = questionsList.find(q => q.difficulty === "medium");
      if (mediumQuestion) nextQuestionIndex = questionsList.indexOf(mediumQuestion);
    }

    if (nextQuestionIndex < questionsList.length) {
      setCurrentIndex(nextQuestionIndex);
      setCountdownTime(10); // Resets timer for next question
    } else {
      setIsQuizFinished(true); 
    }
  };

  // Reset quiz system
  const resetQuiz = () => {
    axios.post("http://localhost:5000/reset-points", { username: profileData.username })
      .then(() => {
        setProfileData(prev => ({ ...prev, points: 0 }));
        setTotalScore(0);
        setCurrentIndex(0);
        setIsQuizFinished(false);
        setCountdownTime(10);
        setPerformanceData({ correctAnswers: 0, incorrectAnswers: 0 });
      })
      .catch((error) => console.error("Error resetting points:", error));
    setUserResponses([]); 
  };

  // user extending readin material
  const handleLearningMaterialClick = (material) => {
    setChosenMaterial(material); // Set selected material
  };

 
  const switchActivePage = (page) => {
    setActivePageView(page);
    if (page === 'home') {
      setIsPaused(false); // Resumes quiz when returning from different page
    } else {
      setIsPaused(true); // Pause quiz when user on different page
    }
  };

  return (
    <div className="app-layout">
      <div className="sidebar">
        <button onClick={() => switchActivePage('home')}>Home</button>
        <button onClick={() => switchActivePage('points')}>Points</button>
        <button onClick={() => switchActivePage('learn')}>Learn</button>
      </div>

      <div className="content">
        {activePageView === 'home' && (
          <div>
            <h1>Cybersecurity Quiz</h1>
            <header className="points-header">Points: {profileData.points}</header>
            <div><h3>Welcome, {profileData.username}!</h3></div>

            {!isQuizFinished ? (
              <div className="quiz-container">
                <p><b>Q{currentIndex + 1}:</b> {questionsList[currentIndex]?.question_text}</p>
                <h3>Time Left: {countdownTime}s</h3>

                {questionsList[currentIndex]?.type === "Image-Based" && (
                  <img src={questionsList[currentIndex].image_url} alt="Question Image" />
                )}

                <div className="progress-bar-container">
                  {questionsList.map((q, index) => (
                    <div
                      key={index}
                      className={`progress-segment ${
                        index < userResponses.length
                          ? userResponses[index] === "correct"
                            ? "correct"
                            : "incorrect"
                          : ""
                      }`}></div>
                  ))}
                </div>

                {questionsList[currentIndex]?.options.map((option, index) => (
                  <button
                    className="answer-button"
                    key={index}
                    onClick={() => validateAnswer(option, questionsList[currentIndex]?.correct_answer, questionsList[currentIndex]?.type)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <h2>Quiz Completed</h2>
                <p>Your final score is: {totalScore}</p>
                <button className="retry-button" onClick={resetQuiz}>Retry Quiz</button>
                <button className="review-button" onClick={() => switchActivePage('review')}>Review Results</button>
              </div>
            )}
          </div>
        )}

        {activePageView === 'review' && (
          <div>
            <h1>Quiz Review</h1>
            <ul>
              {questionsList.map((q, index) => (
                <li key={index}>
                  <p><b>{q.question_text}</b></p>
                  <p>Your Answer: {userResponses[index]}</p>
                  <p>Correct Answer: {q.correct_answer}</p>
                </li>
              ))}
            </ul>
            <button onClick={() => switchActivePage('home')}>Back to Home</button>
          </div>
        )}

        {activePageView === 'points' && (
          <Points user={profileData} onBackToHome={() => switchActivePage('home')} />
        )}

        {activePageView === 'learn' && (
          <div>
            <h1>Learn More</h1>
            <div>
              <h2>Learning Materials</h2>
              {learningResources.length > 0 ? (
                <div>
                  {learningResources.map((material, index) => (
                    <div className="study-material" key={index}>
                      <h3>{material.title}</h3>
                      <p>{material.content}</p>
                      <button onClick={() => handleLearningMaterialClick(material)}>Read More</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>You need more points to unlock learning materials.</p>
              )}
            </div>
            {chosenMaterial && (
              <div className="study-material">
                <h3>{chosenMaterial.title}</h3>
                <p>{chosenMaterial.content}</p>
                <p><b>Full Description:</b> {chosenMaterial.description}</p>
                <p><b>Key Takeaways:</b> {chosenMaterial.keyTakeaways}</p>
                <a href={chosenMaterial.link} target="_blank" rel="noopener noreferrer">Read Full Material</a>
              </div>
            )}
            <button onClick={() => switchActivePage('home')}>Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
