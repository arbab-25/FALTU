"""Optional external AI provider seam.

If VISION_API_KEY / GEMINI_API_KEY are configured, a real service could be
called here. For the SIH prototype no external calls are made; the demo
engine in waste_classifier.py is always used so the demo never depends on
network access or credentials.
"""
from .waste_classifier import analyze_image  # re-export


def get_classifier():
    """Returns the active classifier callable.

    Future: choose between demo and real providers based on config.
    """
    from . import waste_classifier

    return waste_classifier.analyze_image
