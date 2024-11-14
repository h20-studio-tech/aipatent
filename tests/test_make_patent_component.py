import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.make_patent_component import primary_invention


@pytest.fixture
def mock_openai():
    with patch('app.make_patent_component.AsyncOpenAI') as mock:
        client_instance = AsyncMock()
        mock.return_value = client_instance
        yield client_instance

@pytest.fixture
def mock_langfuse():
    with patch('app.make_patent_component.langfuse') as mock:
        # Create mock trace
        mock_trace = MagicMock()
        mock_trace.span.return_value = MagicMock()
        mock_trace.generation.return_value = MagicMock()
        
        # Setup langfuse mock
        mock.trace.return_value = mock_trace
        mock.get_prompt.return_value = MagicMock()
        mock.get_prompt.return_value.compile.return_value = "mocked prompt"
        
        yield mock

@pytest.mark.asyncio
async def test_primary_invention_success(mock_openai, mock_langfuse):
    # Arrange
    mock_response = MagicMock()
    mock_response.text = "Generated invention text"
    mock_openai.chat.completions.create.return_value = mock_response
    
    # Act
    result = await primary_invention(
        antigen="test_antigen",
        disease="test_disease",
        model="test-model"
    )
    
    # Assert
    assert isinstance(result, MagicMock)
    assert result.text == "Generated invention text"
    mock_openai.chat.completions.create.assert_called_once()
    mock_langfuse.trace.assert_called_once()

@pytest.mark.asyncio
async def test_primary_invention_empty_inputs():
    # Test with empty antigen
    with pytest.raises(ValueError, match="Disease and antigen must be non-empty strings"):
        await primary_invention(antigen="", disease="test_disease", model="test-model")
    
    # Test with empty disease
    with pytest.raises(ValueError, match="Disease and antigen must be non-empty strings"):
        await primary_invention(antigen="test_antigen", disease="", model="test-model")

@pytest.mark.asyncio
async def test_primary_invention_none_inputs():
    # Test with None antigen
    with pytest.raises(ValueError, match="Disease and antigen must be non-empty strings"):
        await primary_invention(antigen=None, disease="test_disease", model="test-model")
    
    # Test with None disease
    with pytest.raises(ValueError, match="Disease and antigen must be non-empty strings"):
        await primary_invention(antigen="test_antigen", disease=None, model="test-model")
