# EngineerVerse

EngineerVerse is a gamified learning platform for engineering and machine learning concepts.

## Game Idea

Players learn optimization by controlling game objects instead of reading only theory.

The main game, Optimizer Dojo, visualizes Gradient Descent on interactive loss functions. Players choose a learning rate and observe weight updates, gradients, loss, convergence, and divergence.

The Physics Optimizer visualizes a 22-weight model as a side-view launch. Two important weights control the visible motion while the remaining weights update in the background. Players can switch learning-rate schedules during a run and compare their paths.

## Learning Topics

- Gradient Descent
- Learning-rate selection
- Weight and gradient updates
- Convergence and divergence
- Decay schedules
- Non-convex optimization challenges

## Project Structure

- `frontend/` - React, p5.js, and interactive game experiences
- `backend/` - FastAPI validation and challenge services
- `content/` - Challenge definitions
- `docs/` - Project documentation

## Running Locally

```bash
cd frontend
npm install
npm run dev
```
