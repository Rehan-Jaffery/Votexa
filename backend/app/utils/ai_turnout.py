import numpy as np
from sklearn.linear_model import LinearRegression

# We will create a simple synthetic model to represent expected voting behavior.
# In a real-world scenario, you would train this on historical election data.
# For Votexa's thesis demo, we train a baseline model that expects:
# - Higher turnout if more hours have passed since the election started.
# - Slightly lower turnout if the class size is massive (bystander effect).
# - The predicted final turnout is always slightly higher than the current turnout
#   to reflect that elections typically gain more votes before closing.

class TurnoutPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self._train_baseline_model()

    def _train_baseline_model(self):
        # Synthetic Data Features: [hours_elapsed, total_students, current_turnout_percent]
        # Target: final_turnout_percent
        
        # Expanded training data covering more realistic scenarios:
        # - Small classes tend to have higher final turnout
        # - High early turnout usually means strong final turnout
        # - Very long elapsed time with low turnout = voter fatigue
        
        X_train = np.array([
            [1,  50,  10.0],   # Very early, low turnout -> finishes ~72%
            [2,  40,  25.0],   # Early, moderate start -> finishes ~82%
            [3,  30,  35.0],   # Small class, good start -> finishes ~88%
            [5,  60,  40.0],   # Mid-phase, decent turnout -> finishes ~85%
            [8,  45,  55.0],   # Good momentum -> finishes ~90%
            [12, 80,  60.0],   # Half day in, solid -> finishes ~88%
            [24, 120, 70.0],   # Full day, strong -> finishes ~92%
            [24,  5,  80.0],   # Small class, high turnout -> finishes ~95%
            [36, 150, 65.0],   # 1.5 days, large class -> finishes ~78%
            [48, 200, 50.0],   # Long election, slowing -> finishes ~60%
            [48,  10, 60.0],   # Long election, small class -> finishes ~85%
            [72,  30, 70.0],   # Very long, decent -> finishes ~82%
            [100, 5,  80.0],   # Very long, small class, high -> finishes ~92%
        ])
        
        y_train = np.array([72.0, 82.0, 88.0, 85.0, 90.0, 88.0, 92.0, 95.0, 78.0, 60.0, 85.0, 82.0, 92.0])
        
        self.model.fit(X_train, y_train)

    def predict(self, hours_elapsed, total_students, current_turnout_percent):
        """
        Predicts the final turnout percentage.
        """
        # Ensure values make logical sense
        if hours_elapsed < 0: hours_elapsed = 0
        
        X_test = np.array([[hours_elapsed, total_students, current_turnout_percent]])
        predicted_turnout = self.model.predict(X_test)[0]
        
        # Post-processing to keep predictions realistic
        # Final turnout should always be at least a few % higher than current
        # (elections always gain a few more votes before closing)
        minimum_predicted = current_turnout_percent + max(3.0, (100 - current_turnout_percent) * 0.15)
        predicted_turnout = max(predicted_turnout, minimum_predicted)
        
        # Final turnout can't be higher than 100%
        predicted_turnout = min(predicted_turnout, 100.0)
        
        return round(predicted_turnout, 2)

# Singleton instance
turnout_predictor = TurnoutPredictor()
