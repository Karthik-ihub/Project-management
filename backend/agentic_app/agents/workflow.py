from langgraph.graph import StateGraph
from typing import TypedDict
from agentic_app.agents.idea_agent import process_idea
from agentic_app.agents.epic_agent import generate_epics_and_stories
from agentic_app.agents.team_matcher_agent import match_team_and_allocate  # NEW

class AgentState(TypedDict):
    project_id: str
    idea: str
    team_metadata: dict
    agent1_output: dict
    agent2_output: dict
    agent3_output: dict  # NEW

def agent1_node(state: AgentState) -> AgentState:
    """Run Agent 1: Idea Understanding & Feature Extraction."""
    try:
        analysis = process_idea(state["project_id"], state["idea"], state["team_metadata"])
        state["agent1_output"] = analysis
        return state
    except Exception as e:
        raise ValueError(f"Agent 1 failed: {e}")

def agent2_node(state: AgentState) -> AgentState:
    """Run Agent 2: Epic and Story Generator."""
    try:
        features = state["agent1_output"].get("features", [])
        epics_stories = generate_epics_and_stories(features, state["project_id"])
        state["agent2_output"] = epics_stories
        return state
    except Exception as e:
        raise ValueError(f"Agent 2 failed: {e}")

def agent3_node(state: AgentState) -> AgentState:
    """Run Agent 3: Team Skill Matcher & Story Allocator."""
    try:
        allocations = match_team_and_allocate(state["project_id"])
        state["agent3_output"] = allocations
        return state
    except Exception as e:
        raise ValueError(f"Agent 3 failed: {e}")

# Define the workflow
workflow = StateGraph(AgentState)
workflow.add_node("agent1", agent1_node)
workflow.add_node("agent2", agent2_node)
workflow.add_node("agent3", agent3_node)  # NEW

# Define execution order
workflow.add_edge("agent1", "agent2")
workflow.add_edge("agent2", "agent3")  # NEW

workflow.set_entry_point("agent1")
workflow.set_finish_point("agent3")  # Now finishes at Agent 3

# Compile the workflow
app = workflow.compile()
